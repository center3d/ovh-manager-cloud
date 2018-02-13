class IpLoadBalancerVrackHelper {
    constructor (CloudPoll, IpLoadBalancerVrackService, OvhApiVrack) {
        this.CloudPoll = CloudPoll;
        this.IpLoadBalancerVrackService = IpLoadBalancerVrackService;
        this.OvhApiVrack = OvhApiVrack;
    }

    associateVrack (serviceName, network = { networkId: "pn-16343", displayName: "someName" }, vrackCreationRules) {
        this.IpLoadBalancerVrackService.associateVrack(serviceName, network.networkId)
            .then(task => {
                vrackCreationRules.status = "activating";
                return this.pollCreationRules(task);
            })
            .then(() => this.IpLoadBalancerVrackService.getNetworkCreationRules(serviceName, { resetCache: true }))
            .then(creationRules => {
                _.extend(vrackCreationRules, creationRules);
            });
    }

    deAssociateVrack (serviceName, vrackCreationRules) {
        this.IpLoadBalancerVrackService.deAssociateVrack(serviceName)
            .then(task => {
                vrackCreationRules.status = "deactivating";
                return this.pollCreationRules(task);
            })
            .then(() => this.IpLoadBalancerVrackService.getNetworkCreationRules(serviceName, { resetCache: true }))
            .then(creationRules => {
                _.extend(vrackCreationRules, creationRules);
            });
    }

    pollCreationRules (task) {
        return this.CloudPoll.poll({
            item: task,
            pollFunction: () => this.OvhApiVrack.Lexi().task({ serviceName: task.serviceName, taskId: task.id })
                .$promise
                .catch(() => ({ status: "done" })),
            stopCondition: item => item.status === "done" || item.status === "error"
        }).$promise;
    }
}

angular.module("managerApp").service("IpLoadBalancerVrackHelper", IpLoadBalancerVrackHelper);
