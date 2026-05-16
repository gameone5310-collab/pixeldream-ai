
module {
  /// Return true if the prompt passes content moderation
  public func isAllowed(prompt : Text) : Bool {
    let lower = prompt.toLower();
    let banned = ["nsfw", "porn", "nude", "naked", "gore", "violence", "child", "loli", "illegal", "terrorist", "weapon", "drugs"];
    for (word in banned.values()) {
      if (lower.contains(#text word)) {
        return false;
      };
    };
    true;
  };
};
