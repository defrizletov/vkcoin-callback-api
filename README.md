# vkcoin-callback-api

Модуль для работы с методами VK Coin API

<p align="center">
  <h1>VKCOIN-CALLBACK-API</h1>
  <a href="https://www.npmjs.com/package/vkcoin-callback-api"><img src="https://img.shields.io/npm/v/vkcoin-callback-api.svg?style=flat-square" alt="NPM version"></a>
  <a href="https://www.npmjs.com/package/vkcoin-callback-api"><img src="https://img.shields.io/npm/dt/vkcoin-callback-api.svg?style=flat-square" alt="NPM downloads"></a>
</p>

# Авторизация пользователя

<p>
Для начала работы, необходимо получить Merchant Key от аккаунта <a href="https://vk.com/@hs-marchant-api">здесь</a>
После того как мы получили платежный ключ, необходимо авторизоваться
</p>

```js
const VKCOIN = require("vkcoin-callback-api");
const vkcoin = new VKCOIN({
  id: 0, // Ваш ID
  key: "" // Ваш Merchant Key
});
```

Ссылка на оплату состоит из трех частей:

1. Ваш ID (19039187)

2. Сумма перевода в тысячных долях (1000 = 1 VK Coin)

3. Payload – любое число от -2000000000 до 2000000000, вернется Вам в списке транзаций

Далее их надо объединить в такую ссылку: vk.com/coin#x19039187*1000* 2000000000

Это и будет ссылка на оплату для пользователя (обратите внимание, что самому себе переводы запрещены). По умолчанию пользователь не может изменить сумму перевода. Если это требуется, сделайте ссылку вида

vk.com/coin#x19039187_1000_2000000000_1 — свободная сумма

vk.com/coin#x19039187_1000_2000000000 — фиксированная сумма

# Получаем ссылку на оплату

```js
/*
* amount — количество койнов по умолчанию (число).
* payload — параметр, который вернет VK Coin при пополнении по ссылке (число от -2000000000 до 2000000000).
* isFixed — параметр, отвечающий за изменение суммы пополнения (если поставить true то сумму можно будет менять, не ставьте, если нужна фиксированная сумма).
*/
vkcoin.getLink(amount, payload, isFixed);

console.log(vkcoin.getLink(100500, 123456789)); // vk.com/coin#x19039187_100500_123456789
```

# Запуск сервера

После того как мы авторизировались необходимо подписаться на входящие транзакции VK Coin.

```js
vkcoin.startServer({
  server: "132.123.238.45", // Сервер (Обязательное поле)
  port: 3223 // Порт (По умолчанию 1234)
});
```

и запустить сервер для прослушивания новых платежей

```js
vkcoin.startPolling(event => {
  console.log(event);
  // Здесь обрабатывем транзакцию
});
```

# Устанавливаем название магазина

```js
vkcoin.shopName("Name");
```

После того как мы установили параметр названия, можно отправлять VK Coin от имени магазина.

# Выполняем перевод пользователю

```js
vkcoin.send(431035213, 5000);
```

Где 431035213 - ID получателя, 5000 - Количество коинов для перевода (ВНИМАНИЕ! Количество указывается в тысячных долях, то еcть 5000 = 5 VK Coin).

Для того чтобы платеж был от имени магазина, необходимо отправить третий параметр.

```js
vkcoin.send(431035213, 5000, true);
```

## Проверка баланса

Для проверки баланса необходимо обратиться к методу getBalance и передать массив, содержащий не более 100 ID получателей.

```js
async function getBalance() {
  console.log(await vkcoin.getBalance([431035213]));
}

getBalance();
```

После чего мы получим: { response: { '431035213': 10991024280 } }

Для обработки этого ответа console.log(bal.response[431035213]), в таком случае мы получим баланс пользователя 431035213 в тысячных долях 10991024280.

## Получим баланс нескольких пользователей

```js
const usersId = [431035213, 237435213, 237435783];

async function getBalance() {
  const balRes = await vkcoin.getBalance(usersId); // Получаем баланс пользователей
  Object.values(balRes.response).map(balance => console.log(balance / 1000)); // Выведем их в консоль по одному
}
```

## Форматирование возвращаемого значения

```js
vkcoin.format(12345678900); // Вернет значение в привычном формате - 12 345 678,900
```

## Пример использования совместно с vk-io

```js
const VKCOIN = require("vkcoin-callback-api");
const { VK, getRandomId } = require("vk-io");

const vk = new VK({ token: "token" });
const vkcoin = new VKCOIN({
  id: 0, // Ваш ID
  key: "" // Ваш Merchant Key
});

vkcoin.startServer({
  server: "188.323.22.11", // Сервер (Обязательное поле)
  port: 1111 // Порт (По умолчанию 1234)
});

vkcoin.shopName("VK Coin bot"); // Устанавливаем название магазина

vkcoin.startPolling(async event => {
  console.log(event); // Выводим в консоль то, что нам вернет VK Coin при поступлении баланса
  /*
    response — объект, возвращаемый при пополнении бота по ссылке:
    {
      id: 418034787, (id транзакции)
      fromId: 431035213, (id пользователя, отправившего нам коины)
      toId: 354673884, (id нашего бота)
      amount: 5000, (Сумма пополнения * в тысячных долях, то есть нам перевели 5 VK Coin)
      payload: -944320189, (payload перевода * указывается в ссылке на пополнение)
      created_at: 1595181763, (Дата события)
      from_id: 431035213,  (id пользователя, отправившего нам коины)
      to_id: 354673884, (id нашего бота)
      key: 'dbd9579344cdc9d22e912219a3801e34' (хэш)
  }
  */

  // Далее обрабатываем

  const balance = await vkcoin.getBalance([event.fromId]); // Проверяем баланс пользователя, отправившего нам коины
  if ((balance[event.fromId] / 1000) < 5000000) {
    vkcoin.send(event.fromId, 5000000 - (balance[event.fromId] / 1000)); // Отправляем пользователю коины для того, чтобы его баланс был равен 5 000 000

    vk.api.messages.send({ user_id: event.fromId, message: `Мы отправили тебе ${5000000 - balance[event.fromId] / 1000}\nТеперь твой баланс 5 000 000`, random_id: getRandomId() }); // Отправляем пользователю сообщение о том, что его баланс пополнен
  } else {
    vk.api.messages.send({ user_id: event.fromId, message: `Твой баланс ${vkcoin.format(balance[event.fromId] / 1000)}, т.к. твой баланс больше 5 000 000 VK Coin мы тебе ничего не отправим`, random_id: getRandomId() }); // Отправляем пользователю сообщение о том, что его баланс более 5 000 000 VK Coin
  }
});
```

<p align='center'>Made by <a href="https://хор-енотов.рф">ХОР ЕНОТОВ</a></p>

