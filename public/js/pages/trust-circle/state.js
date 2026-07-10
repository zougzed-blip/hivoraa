var TCState = {
  rooms: [],
  currentRoom: null,
  messages: [],
  messagePage: 1,
  hasMoreMessages: true,
  isLoadingMessages: false,

  resetMessagesPagination: function() {
    this.messagePage = 1;
    this.hasMoreMessages = true;
    this.isLoadingMessages = false;
  }
};