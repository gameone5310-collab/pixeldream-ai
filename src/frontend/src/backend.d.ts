import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type ImageId = string;
export type DeviceId = string;
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface RateLimitStatus {
    remainingGenerations: bigint;
    dailyLimit: bigint;
    resetTimeNanos: Timestamp;
}
export interface ImageResult {
    isCached: boolean;
    style: string;
    imageUrl: string;
    timestamp: Timestamp;
    prompt: string;
    imageId: ImageId;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type GenerationError = {
    __kind__: "ContentViolation";
    ContentViolation: null;
} | {
    __kind__: "QueueFull";
    QueueFull: null;
} | {
    __kind__: "RateLimited";
    RateLimited: null;
} | {
    __kind__: "ApiError";
    ApiError: string;
};
export interface TrendingPrompt {
    useCount: bigint;
    promptText: string;
    style: string;
    imageUrl: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface backendInterface {
    generateImage(prompt: string, style: string, deviceId: DeviceId): Promise<{
        __kind__: "ok";
        ok: ImageResult;
    } | {
        __kind__: "err";
        err: GenerationError;
    }>;
    getRateLimitStatus(deviceId: DeviceId): Promise<RateLimitStatus>;
    getTrendingPrompts(style: string | null): Promise<Array<TrendingPrompt>>;
    recordAdWatch(deviceId: DeviceId, adType: string): Promise<boolean>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
