var RSState = {
  resources: [],
  activeType: 'all',
  coursesList: [],
  currentPage: 1,
  hasMore: true,
  isLoading: false,

  resetPagination: function() {
    this.currentPage = 1;
    this.hasMore = true;
    this.isLoading = false;
  }
};