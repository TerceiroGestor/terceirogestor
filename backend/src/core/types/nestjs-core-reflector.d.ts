import '@nestjs/core';

declare module '@nestjs/core' {
  class Reflector {
    get<T = any, R = T>(
      metadataKeyOrDecorator: any,
      target: any,
    ): R | undefined;

    getAll<T = any, R = T>(metadataKeyOrDecorator: any, targets: any[]): R[];

    getAllAndMerge<T = any, R = T>(
      metadataKeyOrDecorator: any,
      targets: any[],
    ): R;

    getAllAndOverride<T = any, R = T>(
      metadataKeyOrDecorator: any,
      targets: any[],
    ): R | undefined;
  }
}

export {};
