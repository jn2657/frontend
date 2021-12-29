const getRandomIntInclusive = (min, max) => {
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  const randomNumber = randomBuffer[0] / (0xffffffff + 1);
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(randomNumber * (max - min + 1)) + min;
};

export const randomHash = () => Math.floor(getRandomIntInclusive(0, 9999) * 1677.7215).toString(16);

export const toCamelCase = (str = '') =>
  str
    .replace(/[^a-z0-9]/gi, ' ')
    .toLowerCase()
    .split(' ')
    .map((el, ind) => ind === 0 ? el : el[0].toUpperCase() + el.substring(1, el.length))
    .join('');

export const toUpperCamelCase = sentence => sentence[0].toUpperCase() + toCamelCase(sentence).slice(1)
