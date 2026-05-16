module {
  public type TrendingPrompt = {
    promptText : Text;
    style : Text;
    useCount : Nat;
    imageUrl : Text;
  };

  public type TrendingEntry = {
    promptText : Text;
    style : Text;
    var useCount : Nat;
    var imageUrl : Text;
    var lastUpdatedNanos : Int;
  };
};
