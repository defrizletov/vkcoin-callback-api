const http = require("http");
const axios = require("axios");
let pollingPort;

module.exports = class VKCOIN {
  constructor (auth) {
    this.key = auth.key;
    this.id = auth.id;
  }

  async startServer (props) {
    if (!props.server) throw new Error("Ошибка запуска сервера: не указан сервер для получения событий!");
    pollingPort = props.port || 1234;
    try {
      return (await axios({
        method: "POST",
        url: "https://coin-without-bugs.vkforms.ru/merchant/set/",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ callback: `http://${props.server}:${pollingPort}`, merchantId: this.id, key: this.key })
      })).data;
    } catch (e) { throw new Error(e.message || "Ошибка сервера!"); }
  }

  async startPolling (hand) {
    try {
      http.createServer((req, res) => {
        if (req.method === "POST") {
          const body = "";
          req.on("data", chunk => body += chunk.toString());
          req.on("end", () => {
              res.writeHead(200, "OK");
              res.end("OK");
              hand(JSON.parse(body));
          });
        }
      }).listen(pollingPort);
    } catch (e) { throw new Error(e.message || "Ошибка сервера!"); }
  }

  async send (toId, amount, fromShop) {
    const dataJSON = fromShop ? { merchantId: this.id, key: this.key, toId, amount, markAsMerchant: true } : { merchantId: this.id, key: this.key, toId, amount };
    try {
      return (await axios({
        method: "POST",
        url: "https://coin-without-bugs.vkforms.ru/merchant/send/",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(dataJSON)
      })).data;
    } catch (e) { throw new Error(e.message || "Ошибка сервера!"); }
  }

  async getBalance (id) {
    try {
      id = Array.isArray(id) ? id : [id];
      if (id.length > 100) throw new Error("Ошибка: Длина массива должна быть не более 100!");
      return (await axios({
        method: "POST",
        url: "https://coin-without-bugs.vkforms.ru/merchant/score/",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ merchantId: this.id, key: this.key, userIds: id })
      })).data;
    } catch (e) { throw new Error(e.message || "Ошибка сервера!"); }
  }

  async shopName (name) {
    try {
      return (await axios({
        method: "POST",
        url: "https://coin-without-bugs.vkforms.ru/merchant/set/",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ merchantId: this.id, key: this.key, name })
      })).data;
    } catch (e) { throw new Error(e.message || "Ошибка сервера!"); }
  }

  getLink (amount, payload, isFixed) {
    if (!this.id) throw new Error("Ошибка: Для начала необходимо авторизироваться!");
    if (isNaN(Number(amount))) throw new Error("Ошибка: Недопустимый формат VK Coin!");
    return `vk.com/coin#x${this.id}_${Number(amount)}_${payload}${isFixed ? "" : "_1"}`;
  }

  format (amount) { return (Number(amount) / 1000).toLocaleString("ru-RU"); }
}