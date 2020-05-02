# Cómo empezar

```
npm install
node <archivo_a_correr>
```

Hay ejemplos para mintear DoC, BPro y BTC2X, y para redimir BPro y DoC libres.
Para más información: https://github.com/money-on-chain/main-RBTC-contract/blob/master/integration-to-MOC-platform.md

# Contratos

## ABIs

Las ABIs de los contratos se incluyen para facilidad y agilidad de uso. Fueron compiladas con _truffle_ a partir de los contratos del repo de MoC mediante:

```
git clone https://github.com/money-on-chain/main-RBTC-contract.git
cd main-RBTC-contract
npm install
npm run truffle-compile
```

Estas ABIs de los contratos pueden quedar obsoletas, por lo que en lo posible se las debe compilar antes de usar esta suite.

## Direcciones

Las direcciones también están hardcodeadas, por lo que ante cualquier inconveniente se debe chequear que sigan siendo válidas.

# Respecto de código de otros repos

- Las transacciones necesitan el gas definido porque de lo contrario fallan.
  - Se las ha seteado a 2,000,000 siguiendo la práctica de la web de MoC.
  - TODO: Chequear para mainnet.
