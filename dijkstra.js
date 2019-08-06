const Promise = require('bluebird')

const graph = {
    S: {A: 5, B: 2},
    A: {C: 4, D: 2},
    B: {A: 8, D: 7},
    C: {D: 6, F: 3},
    D: {F: 1},
    F: {}
};

// Return a map
const getCostMapToAdjacentNode = ((node) => {
    return new Promise((resolve) => {
        const items = graph[node]
        if(!items) {
            resolve(new Map())
        }
        resolve(new Map(Object.entries(items)))
    })
})

const isGoal = (item) => item === 'F'

class Dijkstra{

    constructor (start, getCostMap, isGoal) {
        this.start = start
        this.processedNodes = []
        this.getCostMap = getCostMap
        this.isGoal = isGoal
        this.trackedParent = {}
        this.trackedCosts = {[start]: 0}
    }

    _returnShortestDistance () {
        const self = this
        if (self.finalDistance === undefined) {
            return null
        }
        return self.finalDistance
    }

    _returnPath() {
        const self = this
        if (self.final === undefined) {
            return null
        }
        let currentItem = self.final
        const path = []
        do {
            path.splice(0, 0, currentItem)
            currentItem = self.trackedParent[currentItem]
        } while (currentItem !== self.start)
        path.splice(0, 0, currentItem)
        return path
    }

    _findLowestCostNode (costs, processed)  {

        return new Promise.reduce(Object.keys(costs), (lowest, node) => {
            if (lowest === null && !processed.includes(node)) {
                lowest = node;
            }
            if (costs[node] < costs[lowest] && !processed.includes(node)) {
                lowest = node;
            }
            return lowest;
        }, null)

    };

    _fetchAdjacentCostMap(node) {
        return Promise
            .resolve(this.getCostMap(node))
            .tap((map) => {
                if (typeof map !== 'object') {
                    throw new Error(`Unexpected result from getMoves.
Expected type: Object.
Actual type: ${typeof map}, value: ${map}`)
                }
            })
    }

    _updateDistance(node) {
        const self = this
        let costToReachNode = self.trackedCosts[node];
        return Promise
            .resolve(self._fetchAdjacentCostMap(node))
            .then((map) => {
                    if (!map.size) {
                        return
                    }
                    map.forEach((costFromNodetoChild, child) => {
                        let costToChild = costToReachNode + costFromNodetoChild;
                        if (!self.trackedCosts[child] || self.trackedCosts[child] > costToChild) {
                            self.trackedCosts[child] = costToChild;
                            self.trackedParent[child] = node
                        }
                    })
                })
    }

    _processNode(node) {
        const self = this
        if (self.isDone) {
            return Promise.resolve();
        }
        this.processedNodes.push(node)
        return Promise
            .resolve(self._updateDistance(node))
            .then(() => self._findLowestCostNode(this.trackedCosts, this.processedNodes))
            .tap((nextNode) => {
                if (nextNode === null) {
                    self.isDone = true
                }
                if (self.isGoal(nextNode)) {
                    self.final = nextNode
                    self.isDone = true
                    self.finalDistance = self.trackedCosts[nextNode]
                }
            }).then((nextNode) => self._processNode(nextNode))
    }

    find () {
        const self = this
        return Promise
            .resolve(self._processNode(self.start))
            .then(() => self._returnPath())
    }
}

const dijkstra = new Dijkstra('S', getCostMapToAdjacentNode, isGoal)
dijkstra.find().then(console.log)
