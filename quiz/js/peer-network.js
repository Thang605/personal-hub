/**
 * Peer Network Engine - WebRTC P2P (PeerJS) + BroadcastChannel Fallback
 * Quản lý kết nối thời gian thực giữa Host (Quản trò) và nhiều Players (Người chơi).
 */

class PeerNetwork {
  constructor() {
    this.isHost = false;
    this.peer = null;
    this.peerId = null;
    this.pin = null;
    this.connections = new Map(); // Host: Map<playerId, DataConnection>
    this.hostConn = null; // Player: DataConnection to Host
    this.broadcastChannel = null;
    this.listeners = new Map(); // Map<eventType, Set<callback>>
    this.status = "disconnected"; // disconnected, connecting, connected, error
    this.playerId = "player_" + Math.random().toString(36).substring(2, 9);
  }

  // Đăng ký sự kiện
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in event listener ${event}:`, err);
        }
      });
    }
  }

  // ==========================================
  // HOST METHODS
  // ==========================================
  initHost(pin) {
    this.isHost = true;
    this.pin = pin;
    this.status = "connecting";
    this.emit("status_change", { status: "connecting" });

    // Tạo kênh BroadcastChannel cục bộ (cho phép test nhiều tab cùng máy)
    this._initBroadcastChannel(pin);

    // Chuẩn hóa Peer ID cho Host: quizhub-{PIN}
    const hostPeerId = `phub-room-${pin}`;

    try {
      this.peer = new Peer(hostPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
        }
      });

      this.peer.on("open", (id) => {
        this.peerId = id;
        this.status = "connected";
        console.log(`[Host Network] Phòng đã mở với Peer ID: ${id}`);
        this.emit("host_ready", { pin: this.pin, peerId: id });
        this.emit("status_change", { status: "connected" });
      });

      this.peer.on("connection", (conn) => {
        console.log(`[Host Network] Có kết nối mới từ: ${conn.peer}`);
        this._setupHostConnection(conn);
      });

      this.peer.on("error", (err) => {
        console.warn(`[Host Network] Lỗi PeerJS (${err.type}):`, err.message);
        // Nếu ID đã tồn tại do mở lại hoặc trùng, thử ID thay thế
        if (err.type === "unavailable-id") {
          const altId = `phub-room-${pin}-${Math.floor(Math.random() * 1000)}`;
          console.log(`[Host Network] Thử lại với ID thay thế: ${altId}`);
          this.peer = new Peer(altId);
          this.peer.on("open", (newId) => {
            this.peerId = newId;
            this.status = "connected";
            this.emit("host_ready", { pin: this.pin, peerId: newId });
          });
          this.peer.on("connection", (conn) => this._setupHostConnection(conn));
        } else {
          this.emit("error", { error: err.message, type: err.type });
        }
      });

    } catch (e) {
      console.error("[Host Network] Không thể khởi tạo PeerJS, sử dụng kênh dự phòng:", e);
      this.status = "connected";
      this.emit("host_ready", { pin: this.pin, peerId: "local-only" });
    }
  }

  _setupHostConnection(conn) {
    conn.on("open", () => {
      console.log(`[Host Network] Kết nối DataChannel đã mở: ${conn.peer}`);
    });

    conn.on("data", (data) => {
      this._handleIncomingMessage(data, conn);
    });

    conn.on("close", () => {
      console.log(`[Host Network] Người chơi ngắt kết nối: ${conn.peer}`);
      // Tìm playerId từ connection
      for (const [pId, c] of this.connections.entries()) {
        if (c.peer === conn.peer) {
          this.connections.delete(pId);
          this.emit("player_disconnected", { playerId: pId });
          break;
        }
      }
    });

    conn.on("error", (err) => {
      console.error(`[Host Network] Lỗi kết nối với ${conn.peer}:`, err);
    });
  }

  // Host phát tin nhắn tới tất cả người chơi
  broadcast(message) {
    const payload = JSON.stringify(message);

    // Gửi qua WebRTC PeerJS
    this.connections.forEach((conn) => {
      if (conn && conn.open) {
        try {
          conn.send(payload);
        } catch (err) {
          console.warn("[Host Network] Lỗi khi gửi tới peer:", err);
        }
      }
    });

    // Gửi qua BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ from: "host", payload: message });
      } catch (err) {
        console.warn("[Host Network] Lỗi BroadcastChannel:", err);
      }
    }
  }

  // Host gửi tin nhắn tới riêng một người chơi
  sendToPlayer(playerId, message) {
    const conn = this.connections.get(playerId);
    const payload = JSON.stringify(message);
    if (conn && conn.open) {
      conn.send(payload);
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ from: "host", target: playerId, payload: message });
    }
  }

  // ==========================================
  // PLAYER METHODS
  // ==========================================
  initPlayer(pin, playerInfo) {
    this.isHost = false;
    this.pin = pin;
    this.playerInfo = playerInfo;
    this.playerId = playerInfo.id || this.playerId;
    this.status = "connecting";
    this.emit("status_change", { status: "connecting" });

    // Khởi tạo BroadcastChannel
    this._initBroadcastChannel(pin);

    const hostPeerId = `phub-room-${pin}`;
    const myPeerId = `phub-p-${pin}-${this.playerId}`;

    try {
      this.peer = new Peer(myPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
        }
      });

      this.peer.on("open", (id) => {
        console.log(`[Player Network] Peer opened với ID: ${id}. Đang kết nối tới Host...`);
        this._connectToHost(hostPeerId);
      });

      this.peer.on("error", (err) => {
        console.warn("[Player Network] Lỗi PeerJS:", err.type, err.message);
        // Thử kết nối trực tiếp qua BroadcastChannel
        this._sendJoinViaBroadcast();
      });

    } catch (e) {
      console.warn("[Player Network] Không thể tạo PeerJS, thử BroadcastChannel:", e);
      this._sendJoinViaBroadcast();
    }
  }

  _connectToHost(hostPeerId) {
    try {
      const conn = this.peer.connect(hostPeerId, {
        reliable: true
      });

      this.hostConn = conn;

      conn.on("open", () => {
        console.log("[Player Network] Đã kết nối thành công tới Host qua WebRTC!");
        this.status = "connected";
        this.emit("status_change", { status: "connected" });

        // Gửi thông điệp JOIN
        this.sendToHost({
          type: "JOIN",
          playerId: this.playerId,
          name: this.playerInfo.name,
          avatar: this.playerInfo.avatar
        });
      });

      conn.on("data", (data) => {
        this._handleIncomingMessage(data, conn);
      });

      conn.on("close", () => {
        console.warn("[Player Network] Mất kết nối tới Host!");
        this.status = "disconnected";
        this.emit("status_change", { status: "disconnected" });
        this.emit("host_disconnected");
      });

      conn.on("error", (err) => {
        console.error("[Player Network] Lỗi DataChannel:", err);
      });

    } catch (e) {
      console.error("[Player Network] Lỗi kết nối tới Host:", e);
    }
  }

  // Player gửi tin nhắn lên Host
  sendToHost(message) {
    const payload = JSON.stringify(message);

    if (this.hostConn && this.hostConn.open) {
      try {
        this.hostConn.send(payload);
      } catch (err) {
        console.warn("[Player Network] Lỗi gửi qua PeerJS:", err);
      }
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          from: "player",
          playerId: this.playerId,
          payload: message
        });
      } catch (err) {
        console.warn("[Player Network] Lỗi gửi qua BroadcastChannel:", err);
      }
    }
  }

  // ==========================================
  // BROADCAST CHANNEL & MESSAGE HANDLING
  // ==========================================
  _initBroadcastChannel(pin) {
    if (window.BroadcastChannel) {
      this.broadcastChannel = new BroadcastChannel(`quiz_phub_${pin}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data;
        if (!msg) return;

        if (this.isHost && msg.from === "player") {
          this._handleIncomingMessage(JSON.stringify(msg.payload), null, msg.playerId);
        } else if (!this.isHost && msg.from === "host") {
          if (!msg.target || msg.target === this.playerId) {
            this._handleIncomingMessage(JSON.stringify(msg.payload), null);
          }
        }
      };
    }
  }

  _sendJoinViaBroadcast() {
    setTimeout(() => {
      this.status = "connected";
      this.emit("status_change", { status: "connected" });
      this.sendToHost({
        type: "JOIN",
        playerId: this.playerId,
        name: this.playerInfo.name,
        avatar: this.playerInfo.avatar
      });
    }, 500);
  }

  _handleIncomingMessage(rawData, conn, fallbackPlayerId) {
    let msg = rawData;
    if (typeof rawData === "string") {
      try {
        msg = JSON.parse(rawData);
      } catch (e) {
        return;
      }
    }

    if (!msg || !msg.type) return;

    // Nếu là Host nhận JOIN từ Player
    if (this.isHost && msg.type === "JOIN") {
      const pId = msg.playerId || fallbackPlayerId;
      if (conn && pId) {
        this.connections.set(pId, conn);
      }
      this.emit("player_join", {
        playerId: pId,
        name: msg.name,
        avatar: msg.avatar
      });
      return;
    }

    // Nếu là Host nhận LIVE_VOTE (Người chơi chọn đáp án khi chưa hết giờ)
    if (this.isHost && msg.type === "LIVE_VOTE") {
      this.emit("player_vote", {
        playerId: msg.playerId || fallbackPlayerId,
        choiceIndex: msg.choiceIndex,
        timestamp: msg.timestamp || Date.now()
      });
      return;
    }

    // Bắn sự kiện ra hệ thống
    this.emit(msg.type.toLowerCase(), msg);
    this.emit("message", msg);
  }

  destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {}
      this.peer = null;
    }
    this.connections.clear();
    this.listeners.clear();
  }
}

window.PeerNetwork = PeerNetwork;
