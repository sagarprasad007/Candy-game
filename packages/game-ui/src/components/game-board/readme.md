# game-board



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute        | Description | Type      | Default  |
| --------------- | ---------------- | ----------- | --------- | -------- |
| `activeEffects` | `active-effects` |             | `any`     | `[]`     |
| `cols`          | `cols`           |             | `number`  | `8`      |
| `disabled`      | `disabled`       |             | `boolean` | `false`  |
| `gridData`      | `grid-data`      |             | `any`     | `[]`     |
| `hintMove`      | `hint-move`      |             | `any`     | `null`   |
| `isFever`       | `is-fever`       |             | `boolean` | `false`  |
| `phase`         | `phase`          |             | `string`  | `'idle'` |
| `rows`          | `rows`           |             | `number`  | `8`      |
| `selectedCol`   | `selected-col`   |             | `number`  | `-1`     |
| `selectedRow`   | `selected-row`   |             | `number`  | `-1`     |
| `showFps`       | `show-fps`       |             | `boolean` | `false`  |
| `swapAnimation` | `swap-animation` |             | `any`     | `null`   |


## Events

| Event                | Description | Type                                                                                       |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `game-tile-selected` |             | `CustomEvent<{ row: number; col: number; }>`                                               |
| `tile-swapped`       |             | `CustomEvent<{ from: { row: number; col: number; }; to: { row: number; col: number; }; }>` |


## Methods

### `forceRefresh() => Promise<void>`



#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
