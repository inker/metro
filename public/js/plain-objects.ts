declare module Plain {
    type Platform = {
        name: string;
        altName: string;
        oldName: string;
        station: number;
        location: {
            lat: number;
            lng: number
        };
        elevation: number;
        spans: number[];
        transfers: number[];
    };

    type Station = {
        name: string;
        altName: string;
        oldName: string;
        location: {
            lat: number;
            lng: number
        };
        platforms: number[];
    };

    type Transfer = {
        source: number;
        target: number;
    };

    type Span = {
        source: number;
        target: number;
        routes: number[];
    };

    type Route = {
        line: string;
        branch: string;
    };

    type StationOrPlatform = {
        location: {
            lat: number;
            lng: number;
        };
        name: string;
        altName: string;
    }
}

//export default Plain;
export = Plain;