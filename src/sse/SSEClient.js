import Bus from "@/assets/js/bus";
import _ from "lodash";
import store from "@/store";
import {generateUUID} from "ant-design-vue/lib/vc-select/util";

let eventSource = null;
let timer = null;
let lastHeartbeat = new Date().getTime();
// 指数退避重连参数
let retryCount = 0;
const MAX_RETRY_DELAY = 30000; // 最大重连间隔30秒
const BASE_RETRY_DELAY = 1000; // 初始重连间隔1秒
let retryTimer = null;

const uuid = generateUUID();

function doConnect(username) {
  if (typeof (EventSource) === 'undefined') {
    console.error('EventSource is not supported by the browser');
    return;
  }
  // 关闭旧连接
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  const url = `/api/events?username=${username}&uuid=${uuid}`;
  eventSource = new EventSource(url);
  eventSource.addEventListener('message', function (event) {
    // 连接成功，重置重试计数
    retryCount = 0;
    if (event.data === 'h') {
      // 心跳包, 超过5s没有收到心跳包, 则关闭连接
      lastHeartbeat = new Date().getTime()
    } else {
      const msg = JSON.parse(event.data);
      onMessage(msg)
    }
  });
  eventSource.addEventListener('error', function () {
    eventSource.close();
    eventSource = null;
    scheduleReconnect(username);
  });
  // 清除定时器
  if (timer) {
    clearInterval(timer);
  }
  // 3s检测一次连接状态
  timer = setInterval(() => {
    if (!eventSource) {
      return;
    }
    if (eventSource.readyState === 1) {
      // 心跳包, 超过5s没有收到心跳包, 则关闭连接
      if (new Date().getTime() - lastHeartbeat > 5000) {
        eventSource.close();
        eventSource = null;
        scheduleReconnect(username);
      }
    }
    if (eventSource.readyState === 2) {
      scheduleReconnect(username);
    }
  }, 3000);
}

/**
 * 指数退避重连策略，避免服务器宕机时前端大量请求
 */
function scheduleReconnect(username) {
  if (retryTimer) {
    clearTimeout(retryTimer);
  }
  const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
  retryCount++;
  console.log(`SSE will reconnect in ${delay}ms (attempt ${retryCount})`);
  retryTimer = setTimeout(() => {
    doConnect(username);
  }, delay);
}

export function connectToSSE(username) {
  retryCount = 0;
  doConnect(username);
}

function onMessage(msg) {
  const url = msg.url
  if (url === 'synced') {
    store.dispatch('updateMessage', {event: 'msg/synced', data: msg})
  } else {
    store.dispatch('updateMessage', {event: 'msg/file/change', data: msg})
    if ('operationFile' === url) {
      let doc = msg.body
      if (doc.code === 0) {
        Bus.notify({
          title: `${doc.operation}成功`,
          dangerouslyUseHTMLString: true,
          message: `
                <div>
                  <p>form:</p>
                  <pre style="word-break: break-all;white-space: pre-wrap;font-size: 12px;">${doc.from}</pre>
                </div>
                <div>
                  <p>to:</p>
                  <pre style="word-break: break-all;white-space: pre-wrap;font-size: 12px;">${doc.to}</pre>
                </div>`,
          type: 'success',
        });
      } else {
        store.dispatch('updateMessage', {event: 'msg/file/operation/fault', data: msg});
        Bus.notify({
          title: `${doc.operation}失败`,
          dangerouslyUseHTMLString: true,
          message: `<span style="font-size: 12px;">${doc.msg}</span>`,
          type: 'error'
        });
      }
    }
  }
}
