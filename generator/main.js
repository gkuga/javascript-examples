function* syncGenerator() {
  yield 1;
  yield 2;
}

const iterator = syncGenerator();
console.log(iterator.next());
console.log(iterator.next());
console.log(iterator.next());
