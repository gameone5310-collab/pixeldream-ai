import Common "common";

module {
  public type ImageResult = {
    imageId : Common.ImageId;
    imageUrl : Text;
    prompt : Text;
    style : Text;
    timestamp : Common.Timestamp;
    isCached : Bool;
  };

  public type GenerationError = {
    #RateLimited;
    #ContentViolation;
    #ApiError : Text;
    #QueueFull;
  };

  public type CacheEntry = {
    imageId : Common.ImageId;
    imageUrl : Text;
    prompt : Text;
    style : Text;
    timestamp : Common.Timestamp;
  };
};
