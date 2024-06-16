import {Request, Response, Router, json} from 'express'; 
import path from 'path';
import { IWebService } from 'swizzy-web-service';
import { BrowserLogger, ILogger } from '../../../SwizzyCommon/dist';
import { npmLinkInstall } from '../npm-installer';
import { validatePackageName } from '../npm-installer';

const logger: ILogger = new BrowserLogger();

export const router = Router({});
const BASE_PATH = '/v1/manage';
const FILE_NAME = "app.js";
// middleware that is specific to this router
const timeLog = (req: Request, res: Response, next: ()=>void) => {
  console.log('Time: ', Date.now())
  next()
}

router.use(timeLog);
router.use(json());

interface InstallParams {
  toolName: string;
  toolUrl: string;
}

// define the home page route
router.post(`${BASE_PATH}/install`, async (req: Request, res: Response) => {
    // Use link since we are using local packages
    const { toolName } = req.body;
      logger.info(`Request to install tool: ${toolName}`);
  try {
  	validatePackageName(toolName as string);
  	logger.info(`ToolName validated`);
  } catch(e) {
	logger.error(`Invalid package name when attempting to install exception: ${e}`);
	res.status(403).send();
	return;
  }
    try {
      await npmLinkInstall({packageName: toolName});
      logger.info(`Successfully installed package ${toolName}`);
      res.status(200).send();
    } catch(e) {
      logger.error(`Error occurred installing npm package ${toolName} with exception ${e}`);
      res.status(500).send();
    }
});


const runningServices: Map<string, IWebService> = new Map();

// With NPM
router.get(`${BASE_PATH}/run`, async (req: Request, res: Response) => {
  const {toolName} = req.query;
  logger.info(`Request to run tool: ${toolName}`);
  try {
  	validatePackageName(toolName as string);
  	logger.info(`ToolName validated`);
  } catch(e) {
	logger.error(`Invalid package name when attempting to run exception: ${e}`);
	res.status(403).send();
	return;
  }

  try {
    // const toolPath = path.join(`${WEB_SERVICE_LOCAL_REPO_PATH}/${toolName}/${FILE_NAME}`);
    // logger.info(`Toolpath to require: ${toolPath}`);
    // const tool = require(`../../local/repo/services/MyFirstWebService/app.js`);
    // const toolPath = path.join(`../../local/repo/services/${toolName}/${FILE_NAME}`);
    const tool = require(toolName as string);
    let webService = tool.getWebservice();
    await webService.install({app: req.app, logger});
    runningServices.set(toolName as string, webService);
    // tool.install({app: req.app});
    logger.info(`Started running tool: ${toolName}`);
  } catch(e) {
    logger.error(`Error running service: ${toolName}, e: ${e}`);
    res.status(500).send();
  }
  
  res.status(200).send();
});

router.get(`${BASE_PATH}/stop`, async (req: Request, res: Response) => {
  const {toolName} = req.query;
  logger.info(`Request to stop running tool: ${toolName}`);
  try {
  	validatePackageName(toolName as string);
  	logger.info(`ToolName validated`);
  } catch(e) {
	logger.error(`Invalid package name when attempting to stop exception: ${e}`);
	res.status(403).send();
	return;
  } 
  try {

    if(!runningServices.has(toolName as string)) {
      logger.error(`Unable to stop running service ${toolName} as it is not in available services`);
      res.status(404).send();
      return;
    }
    // const toolPath = path.join(`../../local/repo/services/${toolName}/${FILE_NAME}`);
    const webService = runningServices.get(toolName as string)!;
    //logger.info(`Routes: ${req.app}`);
    await webService.uninstall({app: req.app});
    runningServices.delete(toolName as string);
    delete require.cache[require.resolve(toolName as string)];
    // TODO: Should we do NPM uninstall during this step? Maybe an uninstall controller makes sense.
    logger.info(`Stopped running tool: ${toolName}`);
  } catch(e) {
    logger.error(`Error stopping service: ${toolName}, e: ${e}`);
    res.status(500).send();
  }
  
  res.status(200).send();
});

router.get(`${BASE_PATH}/available/services`, (req: Request, res: Response) => {
  res.status(200).json({services: runningServices});
});
