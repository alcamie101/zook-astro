/**
 * Seeded Lehmer (Park-Miller) multiplicative linear congruential pseudo-random number generator
 * S_{n+1} = (S_n * 16807) mod (2^31 - 1)
 */
export class PRNG {
  private s: number;

  constructor(seed = 4289) {
    this.s = seed % 2147483647;
    if (this.s <= 0) this.s += 2147483646;
  }

  /**
   * Returns a pseudo-random floating point number in [0, 1)
   */
  next(): number {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }

  /**
   * Generates normally-distributed Gaussian variates via the Box-Muller transform
   */
  nextGaussian(mean = 0, stdev = 1): number {
    const u = 1 - this.next();
    const v = this.next();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * stdev;
  }
}
