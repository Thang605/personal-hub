/**
 * Multi-Channel Realtime Engine (Hybrid MQTT over WebSocket + WebRTC PeerJS + BroadcastChannel)
 * Đảm bảo kết nối thời gian thực 100% tin cậy giữa Slide/Host và điện thoại học viên
 * Hoạt động tốt trong mọi môi trường: PowerPoint Web Viewer 2.0, Mạng 4G/5G, Zalo, Wi-Fi nội bộ.
 */

class PeerNetwork {
  constructor() {
    this.isHost = false;
    this.pin = null;
    this.playerId = "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
    this.playerInfo = { id: this.playerId, name: "Người chơi", avatar: "🚀" };

    // Channels
    this.peer = null;
    this.peerId = null;
    this.connections = new Map(); // Host: Map<playerId, DataConnection>
    this.hostConn = null; // Player: DataConnection to Host
    this.broadcastChannel = null;
    this.mqttClient = null;
    this.mqttConnected = false;

    // Listeners & State
    this.listeners = new Map();
    this.status = "disconnected"; // disconnected, connecting, connected, error
    this.seenMsgIds = new Set();
    this.seenMsgTimer = null;
  }

  // Đăng ký nhận sự kiện
  on(event, callback) {
    const ev = event.toLowerCase();
    if (!this.listeners.has(ev)) {
      this.listeners.set(ev, new Set());
    }
    this.listeners.get(ev).add(callback);
    return () => this.off(ev, callback);
  }

  off(event, callback) {
    const ev = event.toLowerCase();
    if (this.listeners.has(ev)) {
      this.listeners.get(ev).delete(callback);
    }
  }

  emit(event, data) {
    const ev = event.toLowerCase();
    if (this.listeners.has(ev)) {
      this.listeners.get(ev).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[Network] Lỗi trong callback sự kiện ${ev}:`, err);
        }
      });
    }
  }

  // =========================================================================
  // HOST INITIALIZATION
  // =========================================================================
  initHost(pin) {
    this.isHost = true;
    this.pin = String(pin).trim();
    this.status = "connecting";
    this.emit("status_change", { status: "connecting" });

    console.log(`[Host Network] Khởi tạo phòng Host với PIN: ${this.pin}`);

    // 1. Khởi động kênh BroadcastChannel (Cục bộ cùng trình duyệt)
    this._initBroadcastChannel(this.pin);

    // 2. Khởi động MQTT over WebSocket (Cloud Realtime Relay siêu tốc & xuyên mọi tường lửa)
    this._initMqttHost(this.pin);

    // 3. Khởi động WebRTC PeerJS (P2P trực tiếp)
    this._initPeerJsHost(this.pin);
  }

  // =========================================================================
  // PLAYER INITIALIZATION
  // =========================================================================
  initPlayer(pin, playerInfo = {}) {
    this.isHost = false;
    this.pin = String(pin).trim();
    this.playerInfo = Object.assign(this.playerInfo, playerInfo);
    this.playerId = this.playerInfo.id || this.playerId;
    this.status = "connecting";
    this.emit("status_change", { status: "connecting" });

    console.log(`[Player Network] Người chơi ${this.playerId} đang kết nối phòng PIN: ${this.pin}`);

    // 1. Khởi động kênh BroadcastChannel
    this._initBroadcastChannel(this.pin);

    // 2. Khởi động MQTT over WebSocket
    this._initMqttPlayer(this.pin);

    // 3. Khởi động WebRTC PeerJS
    this._initPeerJsPlayer(this.pin);
  }

  // =========================================================================
  // MQTT OVER WEBSOCKET IMPLEMENTATION (PAHO MQTT)
  // =========================================================================
  _initMqttHost(pin) {
    if (typeof Paho === "undefined" || !Paho.MQTT) {
      console.warn("[Host Network] Paho MQTT SDK chưa tải. Sẽ chạy chế độ WebRTC/BroadcastChannel.");
      return;
    }

    const hostClientId = "host_" + pin + "_" + Math.random().toString(36).substring(2, 7);
    const hostTopic = `phub/room/${pin}/host`;

    this._connectMqtt(hostClientId, (client) => {
      client.subscribe(hostTopic, { qos: 1 });
      console.log(`[Host Network] Đã subscribe MQTT topic: ${hostTopic}`);
      this.status = "connected";
      this.emit("status_change", { status: "connected", transport: "mqtt" });
      this.emit("host_ready", { pin: this.pin, peerId: this.peerId || "mqtt-active" });
    });
  }

  _initMqttPlayer(pin) {
    if (typeof Paho === "undefined" || !Paho.MQTT) {
      console.warn("[Player Network] Paho MQTT SDK chưa tải. Sẽ chạy chế độ WebRTC/BroadcastChannel.");
      return;
    }

    const playerClientId = "p_" + pin + "_" + this.playerId;
    const globalPlayerTopic = `phub/room/${pin}/players`;
    const directPlayerTopic = `phub/room/${pin}/p/${this.playerId}`;

    this._connectMqtt(playerClientId, (client) => {
      client.subscribe(globalPlayerTopic, { qos: 1 });
      client.subscribe(directPlayerTopic, { qos: 1 });
      console.log(`[Player Network] Đã subscribe MQTT: ${globalPlayerTopic}`);
      this.status = "connected";
      this.emit("status_change", { status: "connected", transport: "mqtt" });

      // Gửi ngay thông điệp JOIN lên Host
      this.sendToHost({
        type: "JOIN",
        playerId: this.playerId,
        name: this.playerInfo.name,
        avatar: this.playerInfo.avatar
      });
    });
  }

  _connectMqtt(clientId, onConnectCallback) {
    const brokers = [
      { host: "broker.hivemq.com", port: 8884, path: "/mqtt", useSSL: true },
      { host: "broker.emqx.io", port: 8084, path: "/mqtt", useSSL: true }
    ];

    let currentIdx = 0;

    const tryConnect = () => {
      if (currentIdx >= brokers.length) {
        console.warn("[Network] Không thể kết nối tới các MQTT broker. Tiếp tục với WebRTC & BroadcastChannel.");
        return;
      }

      const cfg = brokers[currentIdx];
      try {
        const client = new Paho.MQTT.Client(cfg.host, Number(cfg.port), cfg.path, clientId);
        this.mqttClient = client;

        client.onConnectionLost = (responseObject) => {
          this.mqttConnected = false;
          if (responseObject.errorCode !== 0) {
            console.warn("[MQTT] Mất kết nối:", responseObject.errorMessage);
            setTimeout(() => tryConnect(), 3000);
          }
        };

        client.onMessageArrived = (message) => {
          try {
            const rawPayload = message.payloadString;
            this._handleIncomingMessage(rawPayload, null, "mqtt");
          } catch (e) {
            console.error("[MQTT] Lỗi phân tích tin nhắn:", e);
          }
        };

        client.connect({
          useSSL: cfg.useSSL,
          timeout: 5,
          keepAliveInterval: 30,
          cleanSession: true,
          onSuccess: () => {
            this.mqttConnected = true;
            console.log(`[MQTT] Đã kết nối thành công tới ${cfg.host}:${cfg.port}`);
            if (onConnectCallback) onConnectCallback(client);
          },
          onFailure: (err) => {
            console.warn(`[MQTT] Thất bại với ${cfg.host}:${cfg.port}`, err.errorMessage);
            currentIdx++;
            setTimeout(tryConnect, 1000);
          }
        });
      } catch (err) {
        console.warn(`[MQTT] Lỗi khởi tạo client:`, err);
        currentIdx++;
        setTimeout(tryConnect, 1000);
      }
    };

    tryConnect();
  }

  // =========================================================================
  // WEBRTC PEERJS IMPLEMENTATION
  // =========================================================================
  _initPeerJsHost(pin) {
    if (typeof Peer === "undefined") {
      console.warn("[Host Network] PeerJS SDK chưa tải.");
      return;
    }

    const hostPeerId = `phub-room-${pin}`;

    try {
      this.peer = new Peer(hostPeerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun.cloudflare.com:3478" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
        }
      });

      this.peer.on("open", (id) => {
        this.peerId = id;
        this.status = "connected";
        console.log(`[Host Network] PeerJS Host đã sẵn sàng với ID: ${id}`);
        this.emit("host_ready", { pin: this.pin, peerId: id });
        this.emit("status_change", { status: "connected", transport: "webrtc" });
      });

      this.peer.on("connection", (conn) => {
        console.log(`[Host Network] WebRTC kết nối mới từ: ${conn.peer}`);
        this._setupHostConnection(conn);
      });

      this.peer.on("error", (err) => {
        console.warn(`[Host Network] Lỗi PeerJS (${err.type}):`, err.message);
        if (err.type === "unavailable-id") {
          console.log(`[Host Network] ID ${hostPeerId} đang bị giữ, MQTT và BroadcastChannel vẫn hoạt động bình thường.`);
        }
      });
    } catch (e) {
      console.warn("[Host Network] Không thể tạo PeerJS:", e);
    }
  }

  _setupHostConnection(conn) {
    conn.on("open", () => {
      console.log(`[Host Network] DataChannel WebRTC đã mở: ${conn.peer}`);
    });

    conn.on("data", (data) => {
      this._handleIncomingMessage(data, conn, "webrtc");
    });

    conn.on("close", () => {
      for (const [pId, c] of this.connections.entries()) {
        if (c.peer === conn.peer) {
          this.connections.delete(pId);
          this.emit("player_disconnected", { playerId: pId });
          break;
        }
      }
    });

    conn.on("error", (err) => {
      console.warn(`[Host Network] Lỗi PeerJS DataConnection:`, err);
    });
  }

  _initPeerJsPlayer(pin) {
    if (typeof Peer === "undefined") {
      console.warn("[Player Network] PeerJS SDK chưa tải.");
      return;
    }

    const hostPeerId = `phub-room-${pin}`;
    const myPeerId = `phub-p-${pin}-${this.playerId}`;

    try {
      this.peer = new Peer(myPeerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun.cloudflare.com:3478" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
        }
      });

      this.peer.on("open", () => {
        this._connectToPeerHost(hostPeerId);
      });

      this.peer.on("error", (err) => {
        console.warn("[Player Network] PeerJS lỗi:", err.type, err.message);
      });
    } catch (e) {
      console.warn("[Player Network] Không thể tạo PeerJS:", e);
    }
  }

  _connectToPeerHost(hostPeerId) {
    try {
      const conn = this.peer.connect(hostPeerId, { reliable: true });
      this.hostConn = conn;

      conn.on("open", () => {
        console.log("[Player Network] Đã kết nối tới Host qua WebRTC!");
        this.status = "connected";
        this.emit("status_change", { status: "connected", transport: "webrtc" });

        this.sendToHost({
          type: "JOIN",
          playerId: this.playerId,
          name: this.playerInfo.name,
          avatar: this.playerInfo.avatar
        });
      });

      conn.on("data", (data) => {
        this._handleIncomingMessage(data, conn, "webrtc");
      });

      conn.on("close", () => {
        console.warn("[Player Network] Kênh WebRTC đóng. MQTT vẫn tiếp tục hoạt động.");
      });
    } catch (e) {
      console.warn("[Player Network] Lỗi kết nối WebRTC tới Host:", e);
    }
  }

  // =========================================================================
  // BROADCAST CHANNEL (SAME-BROWSER TABS)
  // =========================================================================
  _initBroadcastChannel(pin) {
    if (window.BroadcastChannel) {
      try {
        this.broadcastChannel = new BroadcastChannel(`quiz_phub_${pin}`);
        this.broadcastChannel.onmessage = (event) => {
          const msg = event.data;
          if (!msg) return;

          if (this.isHost && msg.from === "player") {
            this._handleIncomingMessage(msg.payload, null, "broadcast", msg.playerId);
          } else if (!this.isHost && msg.from === "host") {
            if (!msg.target || msg.target === this.playerId) {
              this._handleIncomingMessage(msg.payload, null, "broadcast");
            }
          }
        };
      } catch (e) {
        console.warn("[Network] Không thể tạo BroadcastChannel:", e);
      }
    }
  }

  // =========================================================================
  // SENDING DATA (MULTI-TRANSPORT)
  // =========================================================================
  broadcast(message) {
    if (!this.isHost) return;

    // Gắn ID thông điệp để loại trừ trùng lặp
    if (!message.msgId) {
      message.msgId = "host_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
    }
    const payloadStr = JSON.stringify(message);

    // 1. Gửi qua MQTT topic
    if (this.mqttClient && this.mqttConnected) {
      try {
        const topic = `phub/room/${this.pin}/players`;
        const mqttMsg = new Paho.MQTT.Message(payloadStr);
        mqttMsg.destinationName = topic;
        mqttMsg.qos = 1;
        this.mqttClient.send(mqttMsg);
      } catch (e) {
        console.warn("[Host Network] Lỗi gửi MQTT broadcast:", e);
      }
    }

    // 2. Gửi qua WebRTC
    this.connections.forEach((conn) => {
      if (conn && conn.open) {
        try {
          conn.send(payloadStr);
        } catch (e) {}
      }
    });

    // 3. Gửi qua BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ from: "host", payload: message });
      } catch (e) {}
    }
  }

  sendToPlayer(playerId, message) {
    if (!this.isHost) return;
    if (!message.msgId) {
      message.msgId = "host_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
    }
    const payloadStr = JSON.stringify(message);

    // 1. MQTT
    if (this.mqttClient && this.mqttConnected) {
      try {
        const topic = `phub/room/${this.pin}/p/${playerId}`;
        const mqttMsg = new Paho.MQTT.Message(payloadStr);
        mqttMsg.destinationName = topic;
        mqttMsg.qos = 1;
        this.mqttClient.send(mqttMsg);
      } catch (e) {}
    }

    // 2. WebRTC
    const conn = this.connections.get(playerId);
    if (conn && conn.open) {
      try { conn.send(payloadStr); } catch (e) {}
    }

    // 3. BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ from: "host", target: playerId, payload: message });
      } catch (e) {}
    }
  }

  sendToHost(message) {
    if (this.isHost) return;
    if (!message.msgId) {
      message.msgId = `${this.playerId}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    }
    if (!message.playerId) {
      message.playerId = this.playerId;
    }
    const payloadStr = JSON.stringify(message);

    // 1. MQTT
    if (this.mqttClient && this.mqttConnected) {
      try {
        const topic = `phub/room/${this.pin}/host`;
        const mqttMsg = new Paho.MQTT.Message(payloadStr);
        mqttMsg.destinationName = topic;
        mqttMsg.qos = 1;
        this.mqttClient.send(mqttMsg);
      } catch (e) {
        console.warn("[Player Network] Lỗi gửi MQTT:", e);
      }
    }

    // 2. WebRTC
    if (this.hostConn && this.hostConn.open) {
      try {
        this.hostConn.send(payloadStr);
      } catch (e) {}
    }

    // 3. BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          from: "player",
          playerId: this.playerId,
          payload: message
        });
      } catch (e) {}
    }
  }

  // =========================================================================
  // MESSAGE RECEIVING & DEDUPLICATION
  // =========================================================================
  _handleIncomingMessage(rawData, conn, transportName, fallbackPlayerId) {
    let msg = rawData;
    if (typeof rawData === "string") {
      try {
        msg = JSON.parse(rawData);
      } catch (e) {
        return;
      }
    }

    if (!msg || !msg.type) return;

    // Loại trừ thông điệp trùng lặp khi nhận đồng thời từ cả MQTT và WebRTC
    if (msg.msgId) {
      if (this.seenMsgIds.has(msg.msgId)) return;
      this.seenMsgIds.add(msg.msgId);
      if (this.seenMsgIds.size > 1000) {
        const first = this.seenMsgIds.values().next().value;
        this.seenMsgIds.delete(first);
      }
    }

    const typeLower = msg.type.toLowerCase();

    // Host xử lý người chơi tham gia (JOIN)
    if (this.isHost && typeLower === "join") {
      const pId = msg.playerId || fallbackPlayerId;
      if (conn && pId) {
        this.connections.set(pId, conn);
      }
      this.emit("player_join", {
        playerId: pId,
        name: msg.name || "Khán giả",
        avatar: msg.avatar || "🚀",
        transport: transportName
      });
      return;
    }

    // Host xử lý lượt bình chọn trực tiếp (LIVE_VOTE)
    if (this.isHost && typeLower === "live_vote") {
      const pId = msg.playerId || fallbackPlayerId;
      this.emit("player_vote", {
        playerId: pId,
        choiceIndex: msg.choiceIndex,
        timestamp: msg.timestamp || Date.now(),
        transport: transportName
      });
      return;
    }

    // Bắn sự kiện ra ngoài
    this.emit(typeLower, msg);
    this.emit("message", msg);
  }

  destroy() {
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch (e) {}
      this.broadcastChannel = null;
    }
    if (this.mqttClient && this.mqttConnected) {
      try { this.mqttClient.disconnect(); } catch (e) {}
      this.mqttClient = null;
      this.mqttConnected = false;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    this.connections.clear();
    this.listeners.clear();
    this.seenMsgIds.clear();
  }
}

window.PeerNetwork = PeerNetwork;

