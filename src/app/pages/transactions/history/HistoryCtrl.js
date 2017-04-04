(function () {
    'use strict';

    angular.module('BlurAdmin.pages.transactions.history')
        .controller('HistoryCtrl', HistoryCtrl);

    /** @ngInject */
    function HistoryCtrl($rootScope,$scope,API,$http,cookieManagement,$uibModal) {

        var vm = this;
        vm.token = cookieManagement.getCookie('TOKEN');

        $rootScope.pagination = {
            pageSize: 25,
            page: 1,
            maxSize: 5
        };

        $rootScope.searchParams = {
            txCode: '',
            searchUserFrom:'',
            searchUserTo:'',
            searchDateFrom: '',
            searchDateTo: '',
            searchType: 'Type',
            searchStatus: 'Status',
            searchCurrency: {},
            orderBy: 'Latest',
            searchSubType: ''
        };

        //used rootscope to communicate between directives
        $rootScope.transactions = [];
        $rootScope.transactionsStateMessage = '';
        $rootScope.transactionsData = {};
        $scope.loadingTransactions = false;
        $scope.typeOptions = ['Type','Deposit','Transfer','Withdraw'];
        $scope.statusOptions = ['Status','Cancelled','Claimed','Complete','Denied','Expired','Failed','Incoming',
                                'Incomplete','Pending','Processing','Reversed','Unclaimed','Uncredited','Waiting'];
        $scope.currencyOptions = [];
        $scope.orderByOptions = ['Largest','Latest','Smallest'];

        $scope.$on('$locationChangeStart', function( event ) {
            delete $rootScope.transactions;
            delete $rootScope.transactionsStateMessage;
            delete $rootScope.transactionsData;
            delete $rootScope.pagination;
            delete $rootScope.searchParams;
        });

        vm.getCompanyCurrencies = function(){
            $http.get(API + '/company/currencies/', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': vm.token
                }
            }).then(function (res) {
                if (res.status === 200) {
                    res.data.data.results.splice(0,0,{code: 'Currency'});
                    $rootScope.searchParams.searchCurrency.code = "Currency";
                    $scope.currencyOptions = res.data.data.results;
                }
            }).catch(function (error) {
                console.log(error);
            });
        };
        vm.getCompanyCurrencies();

        $scope.getLatestTransactions = function(applyFilter){



            if(applyFilter){
                $rootScope.pagination.page = 1;
            }

            console.log($rootScope.pagination.page);

            //console.log($rootScope.searchParams.searchCurrency? 'asd' : '');
            $rootScope.transactionsStateMessage = '';
            $scope.loadingTransactions = true;
            if($rootScope.transactions.length > 0 ){
                $rootScope.transactions.length = 0;
            }

            vm.filterParams = '?page=' + $rootScope.pagination.page + '&page_size=' + $rootScope.pagination.pageSize
                + '&created__gt=' + ($rootScope.searchParams.searchDateFrom? Date.parse($rootScope.searchParams.searchDateFrom) : '')
                + '&created__lt=' + ($rootScope.searchParams.searchDateTo? Date.parse($rootScope.searchParams.searchDateTo) : '')
                + '&currency=' + ($rootScope.searchParams.searchCurrency.code ? ($rootScope.searchParams.searchCurrency.code == 'Currency' ? '' : $rootScope.searchParams.searchCurrency.code) : '')
                + '&from_reference=' + $rootScope.searchParams.searchUserFrom
                + '&to_reference=' + $rootScope.searchParams.searchUserTo
                + '&orderby=' + ($rootScope.searchParams.orderBy == 'Latest' ? '-created' : $rootScope.searchParams.orderBy == 'Largest' ? '-amount' : $rootScope.searchParams.orderBy == 'Smallest' ? 'amount' : '')
                + '&tx_code=' + $rootScope.searchParams.txCode
                + '&tx_type=' + ($rootScope.searchParams.searchType == 'Type' ? '' : $rootScope.searchParams.searchType.toLowerCase())
                + '&status=' + ($rootScope.searchParams.searchStatus == 'Status' ? '' : $rootScope.searchParams.searchStatus)
                + '&subtype=' + $rootScope.searchParams.searchSubType; // all the params of the filtering

            console.log(API + '/admin/transactions/' + vm.filterParams);

                var transactionsUrl = API + '/admin/transactions/' + vm.filterParams;

            $http.get(transactionsUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': vm.token
                }
            }).then(function (res) {
                $scope.loadingTransactions = false;
                if (res.status === 200) {
                    //console.log(res.data.data);
                    $rootScope.transactionsData = res.data.data;
                    $rootScope.transactions = $rootScope.transactionsData.results;
                    if($rootScope.transactions == 0){
                        $rootScope.transactionsStateMessage = 'No Transactions Have Been Found';
                        return;
                    }

                    $rootScope.transactionsStateMessage = '';

                }
            }).catch(function (error) {
                $scope.loadingTransactions = false;
                $rootScope.transactionsStateMessage = 'Failed To Load Data';
                console.log(error);
            });
        };
        $scope.getLatestTransactions();

        $scope.openModal = function (page, size,transaction) {

            $uibModal.open({
                animation: true,
                templateUrl: page,
                size: size,
                controller: 'historyModalCtrl',
                resolve: {
                    transaction: function () {
                        return transaction;
                    }
                }
            });
        };
    }
})();