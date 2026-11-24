declare module "jest-image-snapshot" {
  export const toMatchImageSnapshot: jest.CustomMatcher;
}

declare namespace jest {
  interface Matchers<R> {
    toMatchImageSnapshot(options?: {
      customSnapshotIdentifier?: string;
      failureThreshold?: number;
      failureThresholdType?: "pixel" | "percent";
    }): R;
  }
}
