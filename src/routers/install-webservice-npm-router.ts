// @ts-ignore
import {Request, Response, Router, json} from '@swizzyweb/express'; 
import path from 'path';
import { IWebService } from '@swizzyweb/swizzy-web-service';
import { BrowserLogger, ILogger } from '@swizzyweb/swizzy-common';
import { npmInstall, npmLinkInstall } from '../npm-installer';
import { validatePackageName } from '../npm-installer';
import { AppAttachMode, IDynServeBaseRunRequestBody, IDynServeWebServiceRunRequestBody } from '../model/run-request-body';

const logger: ILogger = new BrowserLogger();

export const router = Router({});
const BASE_PATH = '/v1/webservice';
const FILE_NAME = "app.js";
// middleware that is specific to this router
const timeLog = (req: Request, res: Response, next: ()=>void) => {
  logger.log(`Time: ${new Date().toUTCString()}`);
  next()
}

router.use(timeLog);
router.use(json());

const runningServices: any = {}; //Map<string, IWebService> = new Map<string, IWebService>();

interface InstallParams {
  toolName: string;
  toolUrl: string;
}

// define the home page route
router.post(`${BASE_PATH}/install`, async (req: Request, res: Response) => {
    // Use link since we are using local packages
    const { serviceName } = req.query;
      logger.info(`Request to install service: ${serviceName}`);
  try {
  	validatePackageName(serviceName as string);
  	logger.info(`serviceName validated`);
  } catch(e) {
	logger.error(`Invalid package name when attempting to install exception: ${e}`);
	res.status(403).send();
	return;
  }
    try {
      //await npmLinkInstall({packageName: serviceName});
		//
      	const result = await npmInstall({packageName: serviceName });
		if (!result.success) {
			throw new Error(`Install service ${serviceName} failed`);
		}
		logger.info(`Successfully installed package ${serviceName}`);
      res.status(200).send();
    } catch(e) {
      logger.error(`Error occurred installing npm package ${serviceName} with exception ${e}`);
      res.status(500).send();
    }
});


// With NPM
router.post(`${BASE_PATH}/run`, async (req: Request, res: Response) => {
  const {serviceName} = req.query;

  logger.info(`Request to run service: ${serviceName}`);
  try {
  	validatePackageName(serviceName as string);
  	logger.info(`serviceName validated`);
  } catch(e) {
	logger.error(`Invalid package name when attempting to run exception: ${e}`);
	res.status(403).send();
	return;
  }

  try {
  	logger.info(`Body ${req.body}`);
  	  const runArgs: IDynServeWebServiceRunRequestBody<any>= req.body?.runArgs??{
  	expressConfiguration: {
		app: {
  			attachMode: AppAttachMode.parentApp,
  		}
	},
	serviceArgs: {}
  };
  // TODO: validate
    // const toolPath = path.join(`${WEB_SERVICE_LOCAL_REPO_PATH}/${toolName}/${FILE_NAME}`);
    // logger.info(`Toolpath to require: ${toolPath}`);
    // const tool = require(`../../local/repo/services/MyFirstWebService/app.js`);
    // const toolPath = path.join(`../../local/repo/services/${toolName}/${FILE_NAME}`);
    const tool = require(serviceName as string);
	const serviceApp = runArgs.expressConfiguration?.app.port ? undefined : req.app;//.//runArgs?.expressConfiguration?.app?.attachMode === AppAttachMode.parentApp ? req.app : undefined;
	logger.info(`App in controller: ${req.app}`);
    let webService = tool.getWebservice({...(runArgs?.serviceArgs??{}), app: serviceApp, logger, port: runArgs?.expressConfiguration?.app?.port });
    await webService.install({}/*{app: req.app, logger}*/);
    runningServices[serviceName as string] = webService;
    // tool.install({app: req.app});
    logger.info(`Started running service: ${serviceName}`);
  } catch(e) {
    logger.error(`Error running service: ${serviceName}, e: ${JSON.stringify(e)}`);
    res.status(500).send();
	return;
  }
  
  res.status(200).send();
});

router.post(`${BASE_PATH}/stop`, async (req: Request, res: Response) => {
  const {serviceName} = req.query;
  logger.info(`Request to stop running tool: ${serviceName}`);
  try {
  	validatePackageName(serviceName as string);
  	logger.info(`ToolName validated`);
  } catch(e) {
	logger.error(`Invalid package name when attempting to stop exception: ${e}`);
	res.status(403).send();
	return;
  } 
  try {

    if(!runningServices[serviceName as string]) {
      logger.error(`Unable to stop running service ${serviceName} as it is not in available services`);
      res.status(404).send();
      return;
    }
    // const toolPath = path.join(`../../local/repo/services/${toolName}/${FILE_NAME}`);
    const webService = runningServices[serviceName as string]!;
    //logger.info(`Routes: ${req.app}`);
    await webService.uninstall({}/*{app: req.app}*/);
	delete runningServices[serviceName as string];
    delete require.cache[require.resolve(serviceName as string)];
    // TODO: Should we do NPM uninstall during this step? Maybe an uninstall controller makes sense.
    logger.info(`Stopped running tool: ${serviceName}`);
  } catch(e) {
    logger.error(`Error stopping service: ${serviceName}, e: ${e}`);
    res.status(500).send();
  }
  
  res.status(200).send();
});

router.get(`${BASE_PATH}/running/list`, (req: Request, res: Response) => {
	logger.info("Listing web services");
	logger.debug(`Web services: ${JSON.stringify(runningServices)}`);
  res.status(200).json({services: runningServices});
});
