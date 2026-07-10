var TLState = {
  talents: [],
  activeSort: 'recent',
  currentChatId: null,       
  currentChatUserId: null,  
  conversations: [],         
  isOwnerView: false,
  socket: null,
  currentPage: 1,
  hasMore: true,
  isLoading: false,

  resetPagination: function() {
    this.currentPage = 1;
    this.hasMore = true;
    this.isLoading = false;
  }
};