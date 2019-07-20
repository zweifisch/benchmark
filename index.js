const { fork, isMaster, isWorker } = require('cluster');

const range = (n) => [...new Array(n)].map((x, index) => index)

const zip = lists => range(Math.min(...lists.map(x => x.length))).map(i => lists.map(l => l[i]));

const asyncFunction = Object.getPrototypeOf(async () => {}).constructor;

const isAsync = (fn) => fn instanceof asyncFunction;

const timeIt = async (fn, params) => {
  const _isAsync = isAsync(fn)
  const end = +new Date() + 1000
  let counter = 0
  if (_isAsync) {
    while(new Date() < end) {
      await fn(...params)
      counter ++
    }
  } else {
    while(new Date() < end) {
      fn(...params)
      counter ++
    }
  }
  return counter
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const avg = (...args) => args.reduce((num, total) => num + total) / args.length

const median = (...args) => args.length % 2 === 0 ? (args[args.length / 2] + args[args.length / 2 - 1]) / 2 : args[(args.length - 1) / 2]

const forkTask = (task) => {
  return new Promise((resolve, reject) => {
    const worker = fork();
    worker.on('message', (msg) => {
      if (msg.type === 'DONE') {
        resolve(msg.data)
      }
    });
    worker.send(task);
  })
}

const _compare = async (desc, params, fns, rounds) => {
  console.log(desc)
  const summary = {}
  for (let round = 0; round < rounds; round ++) {
    console.log(`  round #${round + 1}`)
    for (const [key, fn] of Object.entries(fns)) {
      if (!summary[key]) {
        summary[key] = []
      }
      const {ops, rss} = await forkTask({desc, name: key})
      summary[key].push(ops)
      console.log(
        ops.toLocaleString().padStart(12, ' '),
        key.padStart(20),
        `${(rss / 1024).toLocaleString()}k`.padStart(10))
      await sleep(100)
    }
  }
  const report = Object.entries(summary).map(([key, ops]) => [key, Math.floor(avg(...ops)), Math.floor(median(...ops))])
  const [keys, avgs, medians] = zip(report)

  const bestAvg = Math.max(...avgs)
  const bestMedian = Math.max(...medians)

  const avgPercents = avgs.map(x => x/bestAvg)
  const medianPercents = medians.map(x => x/bestMedian)

  console.log('  summary')
  for (const [key, avg, median, avgPercent, medianPercent] of zip([
    keys,
    avgs,
    medians,
    avgPercents,
    medianPercents,
  ]).sort((a, b) => b[3] - a[3])) {
    console.log(
      avg.toLocaleString().padStart(12, ' '),
      format(avgPercent, '1.23%').padStart(7, ' '),
      median.toLocaleString().padStart(12, ' '),
      format(medianPercent, '1.23%').padStart(7),
      key,
    )
  }
}


const isNumber = (charCode) => charCode > 47 && charCode < 58

const parse = (template) => {
  const percent = template.includes('%')
  const comma = template.includes(',')
  const digitsStart = template.indexOf('.')
  let digits = 0
  if (digitsStart !== -1) {
    for (; isNumber(template.charCodeAt(digitsStart + 1 + digits)); digits ++) {}
  }
  return {percent, digits, comma}
}

const format = (number, template) => {
  const {percent, digits, comma} = parse(template)
  if (percent) {
    number = number * 100
  }
  number = number.toFixed(digits)
  if (comma) {
    const [int, frac] = number.split()
    number = `${int.toLocaleString('en-US')}.${frac}`
  }
  return `${number}${percent ? '%' : ''}`
}

const partition = (n, list) => {
  let ret = []
  for (const i of range(list.length / n)) {
    ret[i] = []
    for (let j of range(n)) {
      ret[i][j] = list[i * n + j]
    }
  }
  return ret
}

const compare = async (config, {rounds = 3} = {}) => {
  const _config = partition(3, config)
  if (isMaster) {
    for (const [desc, params, fns] of _config) {
      await _compare(desc, params, fns, rounds)
    }
    return
  }

  process.on('message', async ({desc, name}) => {
    const [_, params, fns] = _config.find(x => x[0] === desc)
    const {rss} = process.memoryUsage();
    const ops = await timeIt(fns[name], params)
    const {rss: rss2} = process.memoryUsage();
    process.send({type: 'DONE', data: {ops, rss: rss2 - rss}});
    process.exit();
  });
  return;

}

module.exports = {compare}
