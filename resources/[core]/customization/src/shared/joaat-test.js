String.prototype.GetHashKey = function () {
  const keyLowered = this.toLowerCase();
  const length = this.length;
  let hash, i;

  for (hash = i = 0; i < length; i++) {
    hash += keyLowered.charCodeAt(i);
    hash += hash << 10;
    hash ^= hash >>> 6;
  }

  hash += hash << 3;
  hash ^= hash >>> 11;
  hash += hash << 15;

  return hash;
};

const test = 41631242;

for (let n = 1000; n--; ) {
  const name = `clothing_item_m_hat_001_tint_${n.toString().padStart(3, '0')}`;
  const hash = name.GetHashKey() >>> 0;

  if (hash === test) {
    console.log(name);
  }
}
