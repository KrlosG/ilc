require('newrelic');
require('./express/express-promise');

const config = require('config');
const server = require('./server');
const app = require('express')();
const tailorFactory = require('./tailor/factory');
const serveStatic = require('./serveStatic');
const registryService = require('./registry/factory');
const errorHandler = require('./errorHandler');

app.use(require('./ping'));

const tailor = tailorFactory(config.get('cdnUrl'));

if (config.get('cdnUrl') === null) {
    app.use('/_ilc/', serveStatic(config.get('productionMode')));
}

app.get('/_ilc/api/v1/registry/template/:templateName', async (req, res) => {
    const data = await registryService.getTemplate(req.params.templateName);

    return res.status(200).send(data.data.content);
});

// Route to test 500 page appearance
app.get('/_ilc/500', () => { throw new Error('500 page test error') });

app.get('*', (req, res) => {
    req.headers['x-request-uri'] = req.url; //TODO: to be removed & replaced with routerProps
    tailor.requestHandler(req, res);
});

app.use(errorHandler);

app.disable('x-powered-by');

server(app);