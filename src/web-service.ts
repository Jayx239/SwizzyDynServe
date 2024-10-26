// @ts-ignore
import { Application } from "@swizzyweb/express";
import { IRunProps, IRunResult, IWebService, WebService } from "@swizzyweb/swizzy-web-service";
// import { router } from "./routers/install-webservice-router";
import { router as webserviceRouter} from "./routers/install-webservice-npm-router";
import { router as toolRouter } from './routers/install-browser-tool-router';
export class SwizzyDynServeService extends WebService {
    name = 'SwizzyDynServeService';
    constructor(props: any) {
        super({...props, routers: [webserviceRouter, toolRouter]});
    }

    // TODO: remove and use base class impl
    /*protected installRouters(app: Application): Promise<any> {
        app.use(webserviceRouter);
		app.use(toolRouter);
        return Promise.resolve();
    }*/

    protected uninstallRouters(app: Application): Promise<any> {
        const logger = this._logger;
        logger.info(`Routes ${app.routes()}`);
        return Promise.resolve();
    }
}

export function install(props: any): IWebService {
    return new SwizzyDynServeService(props);
}
