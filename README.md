# benchmark

```sh
npm i @zf/benchmark
```

```js
const {compare} = require('@zf/benchmark')

const range = (n) => {
  const ret = []
  for(let i = 0; i < n; i ++) {
    ret.push(i)
  }
  return ret
}

const range2 = (n) => [...new Array(n)].map((x, index) => index)

compare([
  'range(10)', [10], {
    range,
    range2, 
  },
  'range(100)', [100], {
    range,
    range2, 
  },
])
```

output

```
range(10)
  round #1
   5,221,533                range     4,288k
   1,302,409               range2     4,548k
  round #2
   5,179,243                range     4,308k
   1,301,607               range2     4,292k
  round #3
   5,189,398                range     4,288k
   1,228,595               range2     4,356k
  summary
   5,196,724 100.00%    5,179,243 100.00% range
   1,277,537  24.58%    1,301,607  25.13% range2
range(100)
  round #1
   1,853,410                range     4,612k
     195,481               range2     4,356k
  round #2
   1,859,328                range     4,676k
     192,886               range2     4,376k
  round #3
   1,862,931                range     4,744k
     192,183               range2     4,284k
  summary
   1,858,556 100.00%    1,859,328 100.00% range
     193,516  10.41%      192,886  10.37% range2
```
