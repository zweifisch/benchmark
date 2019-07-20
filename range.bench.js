const {compare} = require('./')

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
