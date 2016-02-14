import { shortestRoute } from './algorithm';

let graph;

onmessage = e => {
    if (e.data.isArray()) {
        const [p1, p2] = e.data;
        if (graph === null) {
            throw new Error('no graph');
        }
        const obj = shortestRoute(graph, p1, p2);
        return postMessage(obj, '');
    }
    graph = e.data;
}