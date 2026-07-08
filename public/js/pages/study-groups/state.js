var SGState = {
  groups: [],
  currentDetailId: null,

  getGroup: function(id) {
    for (var i = 0; i < this.groups.length; i++) {
      if (this.groups[i]._id === id) return this.groups[i];
    }
    return null;
  },

  isJoined: function(g) {
    var user = Auth.getUser();
    if (!user) return false;
    var userId = user.id || user._id;
    if (!userId || !g.participants) return false;
    for (var i = 0; i < g.participants.length; i++) {
      var p = g.participants[i];
      if (!p) continue;
      var pid = p._id || p.id;
      if (pid === userId) return true;
    }
    return false;
  },

  isFull: function(g) {
    return (g.participants ? g.participants.length : 0) >= g.maxParticipants;
  }
};