(function () {
    /**
     * @name api列表分组
     * @author author：广州银云信息科技有限公司
     */

    angular.module('eolinker')
        .component('homeProjectInsideApiSidebar', {
            template: '<div ng-if="$ctrl.data.sidebarShow">' +
                '<group-default-common-Component authority-object="{\'edit\':$ctrl.service.authority.permission.project.exportAndShare.export,\'export\':$ctrl.service.authority.product.ams==\'free\'?1:$ctrl.service.authority.permission.project.exportAndShare.export}" fun-object="$ctrl.component.groupCommonObject.funObject" sort-object="$ctrl.component.groupCommonObject.sortObject" main-object="$ctrl.component.groupCommonObject.mainObject" list="$ctrl.interaction.response.query"></group-default-common-Component></div>',
            controller: indexController
        })

    indexController.$inject = ['$scope', 'ApiManagementResource', '$state', 'CODE', '$rootScope', 'GroupService', 'Group_AmsCommonService', 'Authority_CommonService', 'Cache_CommonService','$filter'];

    function indexController($scope, ApiManagementResource, $state, CODE, $rootScope, GroupService, Group_AmsCommonService, Authority_CommonService, Cache_CommonService,$filter) {
        var vm = this;
        vm.data = {
            static: {
                query: [{
                    groupID: -1,
                    groupName: $filter('translate')('431'),
                    icon: 'sort'
                }, {
                    groupID: -2,
                    groupName: $filter('translate')('432'),
                    icon: 'shanchu',
                }]
            },
            sidebarShow: null,
            sort: {
                isDisable: false,
                originQuery: [],
                sortable: true
            }
        }
        vm.interaction = {
            request: {
                spaceKey: $state.params.spaceKey,
                projectID: $state.params.projectID,
                grandSonGroupID: $state.params.grandSonGroupID,
                childGroupID: $state.params.childGroupID,
                groupID: $state.params.groupID || (window.sessionStorage.getItem('COMMON_SEARCH_TIP')?null:-1),
                apiID: $state.params.apiID,
                orderNumber: []
            },
            response: {
                query: []
            }
        }
        vm.component = {
            groupCommonObject: {}
        }
        vm.service = {
            defaultCommon: Group_AmsCommonService,
            authority: Authority_CommonService
        }
        var service = {
            cache: Cache_CommonService
        },
        fun={}
        fun.init = function (status) {
            service.cache.clear('ENV_QUERY_AMS_COMPONENT')
            var template = {
                cache: {
                    group: GroupService.get()
                },
                request: {
                    spaceKey: vm.interaction.request.spaceKey,
                    projectID: vm.interaction.request.projectID,
                },
                query: [],
                sort: {
                    array: [],
                }
            }
            if ($state.current.name.indexOf('list') > -1) {
                vm.data.sidebarShow = true;
            } else {
                vm.data.sidebarShow = false;
            }
            if (status != 'reset' && template.cache.group) {
                vm.interaction.response.query = template.cache.group || [];
            } else {
                ApiManagementResource.ApiGroup.Query(template.request).$promise.then(function (response) {
                    switch (response.statusCode) {
                        case CODE.COMMON.SUCCESS:
                            {
                                template.sort.array = vm.service.defaultCommon.sort.init(response);
                                vm.interaction.response.query = template.sort.array || [];
                                if ($state.current.name.indexOf('list') > -1) {
                                    GroupService.set(template.sort.array);
                                } else {
                                    GroupService.set(template.sort.array, true);
                                }
                                break;
                            }
                    }
                })
            }
        }
        fun.init();
        fun.sortCopy = function () {
            $rootScope.InfoModal($filter('translate')('433'), 'success');
            vm.data.sort.originQuery = [];
            angular.copy(vm.interaction.response.query, vm.data.sort.originQuery);
            if (vm.data.sort.originQuery.length > 0) {
                vm.data.sort.isDisable = true;
            }
        }
        fun.sortCancle = function () {
            vm.data.sort.isDisable = false;
        }
        fun.sortConfirm = function () {
            var template = {
                input: {
                    baseRequest: {
                        spaceKey: vm.interaction.request.spaceKey,
                        projectID: vm.interaction.request.projectID,
                        orderNumber: {}
                    },
                    originQuery: vm.data.sort.originQuery,
                    resource: ApiManagementResource.ApiGroup.Sort,
                    callback: null
                }
            }
            template.input.callback = function (response) {
                switch (response.statusCode) {
                    case CODE.COMMON.SUCCESS:
                        {
                            vm.interaction.response.query = vm.data.sort.originQuery;
                            vm.data.sort.isDisable = false;
                            break;
                        }
                }
            }
            vm.service.defaultCommon.sort.operate('confirm', template.input);
        }
        fun.click = function (status, arg) {
            var template = {
                uri: null
            }
            switch (status) {
                case 'first-level':
                    {
                        template.uri = {
                            groupID: arg.item.groupID || -1,
                            childGroupID: null,
                            grandSonGroupID: null
                        }
                        break;
                    }
                case 'second-level':
                    {
                        template.uri = {
                            groupID: arg.parentItem.groupID,
                            childGroupID: arg.item.groupID,
                            grandSonGroupID: null
                        }
                        break;
                    }
                case 'third-level':
                    {
                        template.uri = {
                            groupID: arg.grandParentItem.groupID,
                            childGroupID: arg.parentItem.groupID,
                            grandSonGroupID: arg.item.groupID
                        }
                        break;
                    }
            }
            template.uri.q = null;
            angular.merge(vm.interaction.request, template.uri)
            arg.item.isSpreed = true;
            $state.go('home.project.inside.api.list', template.uri);
        }
        fun.edit = function (status, arg) {
            arg = arg || {};
            var template = {
                options: {
                    callback: fun.init,
                    resource: ApiManagementResource.ApiGroup,
                    originGroupQuery: vm.interaction.response.query,
                    status: status,
                    baseRequest: {
                        spaceKey: vm.interaction.request.spaceKey,
                        projectID: vm.interaction.request.projectID
                    }
                }
            }
            vm.service.defaultCommon.fun.operate('edit', arg, template.options);
        }
        fun.delete = function (arg) {
            arg = arg || {};
            var template = {
                modal: {
                    title: $filter('translate')('434'),
                    message: $filter('translate')('435')
                }
            }
            $rootScope.EnsureModal(template.modal.title, false, template.modal.message, {}, function (callback) {
                if (callback) {
                    ApiManagementResource.ApiGroup.Delete({
                        spaceKey: vm.interaction.request.spaceKey,
                        projectID: vm.interaction.request.projectID,
                        groupID: arg.item.groupID
                    }).$promise.then(function (response) {
                        switch (response.statusCode) {
                            case CODE.COMMON.SUCCESS:
                                {
                                    if (arg.parentItem) {
                                        arg.parentItem.childGroupList.splice(arg.$index, 1);
                                    } else {
                                        vm.interaction.response.query.splice(arg.$index, 1);
                                    }
                                    $rootScope.InfoModal($filter('translate')('436'), 'success');
                                    switch ((vm.interaction.request.groupID || 0).toString()) {
                                        case '-1':
                                        case '-2':
                                            {
                                                $state.reload('home.project.inside.api.list');
                                                break;
                                            }
                                        default:
                                            {
                                                if (arg.grandParentItem && vm.interaction.request.grandSonGroupID == arg.item.groupID) {
                                                    fun.click('second-level', {
                                                        parentItem: arg.grandParentItem,
                                                        item: arg.parentItem
                                                    });
                                                } else if (arg.parentItem && vm.interaction.request.childGroupID == arg.item.groupID) {
                                                    fun.click('first-level', {
                                                        item: arg.parentItem
                                                    });
                                                } else if (vm.interaction.request.groupID == arg.item.groupID) {
                                                    fun.click('first-level', {
                                                        item: vm.data.static.query[1]
                                                    });
                                                } else if ((arg.grandParentItem && vm.interaction.request.childGroupID == arg.parentItem.groupID) || (arg.parentItem && vm.interaction.request.groupID == arg.parentItem.groupID)) {
                                                    $state.reload('home.project.inside.api.list');
                                                }
                                                break;
                                            }
                                    }
                                    break;
                                }
                        }
                    })
                }
            });
        }
        fun.export = function (arg) {
            var template = {
                cache: service.cache.get('ENV_QUERY_AMS_COMPONENT'),
                modal: {
                    title: $filter('translate')('437'),
                    mark: 'exceptHtml',
                    spaceKey: vm.interaction.request.spaceKey,
                    request: {
                        groupID: arg.item.groupID
                    },
                    resource: ApiManagementResource.ApiGroup
                },
                fun: null
            }
            template.fun = function () {
                $rootScope.AMS_ExportModal(template.modal);
            }
            template.fun();
        }
        fun.import = function () {
            var template = {
                modal: {
                    title: $filter('translate')('438'),
                    version: 1,
                    status: 1,
                    request: {
                        spaceKey: vm.interaction.request.spaceKey,
                        projectID: vm.interaction.request.projectID
                    },
                    resource: ApiManagementResource.ApiGroup
                }
            }

            $rootScope.AMS_ImportModal(template.modal, function (callback) {
                if (callback) {
                    fun.init('reset');
                    switch (vm.interaction.request.groupID) {
                        case -1:
                        case '-1':
                            {
                                $state.go('home.project.inside.api.list', {
                                    groupID: $state.params.groupID ? (null) : -1
                                });
                                break;
                            }
                    }
                }
            });
        }
        fun.setSearch=function(){
            if(window.sessionStorage.getItem('COMMON_SEARCH_TIP')){
                vm.component.groupCommonObject.mainObject.searchObject={
                    data:{
                        active:null
                    },
                    fun:{
                        clean:function(){
                            window.sessionStorage.removeItem('COMMON_SEARCH_TIP');
                            vm.component.groupCommonObject.mainObject.searchObject=null;
                            if(!$state.params.groupID){
                                $state.go('home.project.inside.api.list', {
                                    groupID: -1
                                });
                            }
                        },
                        click:function(){
                            vm.interaction.request.groupID=null;
                            $state.go('home.project.inside.api.list', {
                                groupID: null
                            });
                        }
                    }
                    
                }
            }
        }
        $scope.$on('$stateChangeSuccess', function () { //路由更改函数
            if ($state.current.name.indexOf('list') > -1) {
                vm.data.sidebarShow = true;
            } else {
                vm.data.sidebarShow = false;
            }
            vm.interaction.request.groupID = $state.params.groupID || (window.sessionStorage.getItem('COMMON_SEARCH_TIP')?null:-1);
            fun.setSearch();
        })
        vm.$onInit = function () {
            vm.component.groupCommonObject = {
                sortObject: vm.data.sort,
                funObject: {
                    showObject: vm.data.sort,
                    showVar: 'isDisable',
                    btnGroupList: {
                        edit: {
                            key: $filter('translate')('439'),
                            class: 'eo-button-success',
                            icon: 'tianjia',
                            showable: false,
                            fun: fun.edit,
                            params: '"add"'
                        },
                        export: {
                            key: $filter('translate')('440'),
                            class: 'default-btn tab-first-btn',
                            showable: false,
                            fun: fun.import
                        },
                        sortDefault: {
                            key: $filter('translate')('441'),
                            class: 'default-btn tab-last-btn',
                            showable: false,
                            fun: fun.sortCopy
                        },
                        sortConfirm: {
                            key: $filter('translate')('87'),
                            class: 'default-btn tab-first-btn un-margin-left-btn',
                            icon: 'check',
                            showable: true,
                            fun: fun.sortConfirm
                        },
                        sortCancel: {
                            key: $filter('translate')('13'),
                            class: 'default-btn tab-last-btn',
                            icon: 'close',
                            showable: true,
                            fun: fun.sortCancle
                        }
                    }
                },
                mainObject: {
                    level: 2,
                    baseInfo: {
                        name: 'groupName',
                        id: 'groupID',
                        child: 'childGroupList',
                        secondLevelGroupID: 'childGroupID',
                        thirdLevelGroupID: 'grandSonGroupID',
                        current: vm.interaction.request
                    },
                    staticQuery: vm.data.static.query,
                    parentFun: {
                        addChild: {
                            fun: fun.edit,
                            key: $filter('translate')('442'),
                            params: '"add-child",arg',
                            class: 'add-child-btn'
                        },
                        export: {
                            fun: fun.export,
                            key: $filter('translate')('437'),
                            authority: 'export'
                        },
                        edit: {
                            fun: fun.edit,
                            key: $filter('translate')('324'),
                            params: '"edit",arg'
                        },
                        delete: {
                            fun: fun.delete,
                            key: $filter('translate')('259')
                        }
                    },
                    childFun: {
                        export: {
                            fun: fun.export,
                            key: $filter('translate')('437'),
                            authority: 'export'
                        },
                        edit: {
                            fun: fun.edit,
                            key: $filter('translate')('324'),
                            params: '"edit",arg',
                        },
                        delete: {
                            fun: fun.delete,
                            key: $filter('translate')('259')
                        }
                    },
                    baseFun: {
                        click: fun.click,
                        spreed: vm.service.defaultCommon.fun.spreed
                    }
                }
            }
            fun.setSearch();
        }
    }

})();