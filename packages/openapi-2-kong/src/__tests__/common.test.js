import { generateSlug, getName, getSecurity, getServers, parseSpec } from '../common';
import YAML from 'yaml';

describe('common', () => {
  describe('parseSpec()', () => {
    const spec = {
      openapi: '3.0',
      paths: {
        '/': {
          post: {
            responses: {
              '200': {
                $ref: '#/components/schemas/dog',
              },
            },
          },
        },
      },
      components: {
        schemas: {
          dog: { name: { type: 'string' } },
        },
      },
    };

    const specResolved = {
      openapi: '3.0.0',
      components: spec.components,
      info: {},
      paths: {
        '/': {
          post: {
            responses: {
              '200': {
                name: { type: 'string' },
              },
            },
          },
        },
      },
    };

    it('parses JSON spec', async () => {
      const result = await parseSpec(spec);
      expect(result).toEqual(specResolved);
    });

    it('parses JSON spec string', async () => {
      const result = await parseSpec(JSON.stringify(spec));
      expect(result).toEqual(specResolved);
    });

    it('parses YAML spec string', async () => {
      const result = await parseSpec(YAML.stringify(spec));
      expect(result).toEqual(specResolved);
    });
  });

  describe('getServers()', () => {
    const spec = {
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'Swagger Petstore',
      },
      servers: [{ url: 'https://server1.com/path' }],
      paths: {
        '/': {
          servers: [{ url: 'https://server2.com/path' }],
        },
      },
    };

    it('returns path item servers', async () => {
      const s = await parseSpec(spec);
      const result = getServers(s.paths['/']);
      expect(result).toEqual([{ url: 'https://server2.com/path' }]);
    });

    it('returns api servers', async () => {
      const s = await parseSpec(spec);
      const result = getServers(s);
      expect(result).toEqual([{ url: 'https://server1.com/path' }]);
    });
  });

  describe('getSecurity()', () => {
    const spec = {
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'Swagger Petstore',
      },
      servers: [{ url: 'https://server1.com/path' }],
      paths: {
        '/': {
          post: {
            security: [{ petstoreAuth: [] }],
            responses: {},
          },
        },
      },
      security: [{ anotherAuth: [] }],
      components: {
        securitySchemes: {
          petstoreAuth: { type: 'http', scheme: 'basic' },
          anotherAuth: { type: 'http', scheme: 'basic' },
        },
      },
    };

    it('returns path item security', async () => {
      const s = await parseSpec(spec);
      const result = getSecurity(s.paths['/'].post);
      expect(result).toEqual([{ petstoreAuth: [] }]);
    });

    it('returns api security', async () => {
      const s = await parseSpec(spec);
      const result = getSecurity(s);
      expect(result).toEqual([{ anotherAuth: [] }]);
    });
  });

  describe('getName()', () => {
    const spec = {
      openapi: '3.0.0',
      info: { version: '1.0.0', title: 'Swagger Petstore' },
      servers: [{ url: 'https://server1.com/path' }],
      paths: {},
    };

    it('openapi object with x-kong-name', async () => {
      const s = await parseSpec({ ...spec, 'x-kong-name': 'override' });
      const result = getName(s);
      expect(result).toBe('override');
    });

    it('openapi object without', async () => {
      const s = await parseSpec(spec);
      const result = getName(s);
      expect(result).toBe('Swagger_Petstore');
    });

    it('openapi object without anything', async () => {
      const s = await parseSpec({ ...spec, info: { version: '1.0.0' } });
      const result = getName(s);
      expect(result).toBe('openapi');
    });

    it('path object with x-kong-name', async () => {
      const p = { 'x-kong-name': 'kong' };
      const result = getName(p);
      expect(result).toBe('kong');
    });

    it('path object with summary', async () => {
      const p = { 'x-kong-name': 'kong' };
      const result = getName(p);
      expect(result).toBe('kong');
    });
  });

  describe('generateSlug()', () => {
    it('passes basic cases', () => {
      expect(generateSlug('foo')).toBe('foo');
      expect(generateSlug('foo bar')).toBe('foo_bar');
      expect(generateSlug('foo,bar')).toBe('foo_bar');
      expect(generateSlug('Foo Bar')).toBe('Foo_Bar');
    });
  });
});
