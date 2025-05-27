import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as extension from '../extension';

suite('Extension Unit Tests', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
        sinon.restore();
    });

    test('getSubfolders returns only directories', () => {
        const fakeDir = '/fake';
        const files = ['a', 'b', 'c'];
        sandbox.replace(fs, 'readdirSync', () => files as any);
        sandbox.replace(fs, 'existsSync', () => true);

        // Fully mocked statSync result with all required fields and correct type
        sandbox.replace(fs, 'statSync', (p: fs.PathLike): fs.Stats & fs.BigIntStats => {
            const isDir = typeof p === 'string' && (p.endsWith('a') || p.endsWith('c'));
            const now = new Date();
            const stat: fs.Stats & fs.BigIntStats = {
                isDirectory: () => isDir,
                isFile: () => !isDir,
                isBlockDevice: () => false,
                isCharacterDevice: () => false,
                isSymbolicLink: () => false,
                isFIFO: () => false,
                isSocket: () => false,
                dev: 0,
                ino: 0,
                mode: 0,
                nlink: 0,
                uid: 0,
                gid: 0,
                rdev: 0,
                size: 0,
                blksize: 0,
                blocks: 0,
                atime: now,
                mtime: now,
                ctime: now,
                birthtime: now,
                atimeMs: 0,
                mtimeMs: 0,
                ctimeMs: 0,
                birthtimeMs: 0,
                atimeNs: BigInt(0),
                mtimeNs: BigInt(0),
                ctimeNs: BigInt(0),
                birthtimeNs: BigInt(0),
                // BigIntStats methods
                isDirectoryBigInt: () => isDir,
                isFileBigInt: () => !isDir,
                isBlockDeviceBigInt: () => false,
                isCharacterDeviceBigInt: () => false,
                isSymbolicLinkBigInt: () => false,
                isFIFOBigInt: () => false,
                isSocketBigInt: () => false,
            } as any;
            return stat;
        });

        // @ts-ignore
        const result = extension.getSubfolders(fakeDir);
        assert.deepStrictEqual(result, [path.join(fakeDir, 'a'), path.join(fakeDir, 'c')]);
    });

    test('getExtensionsJson returns recommendations and unwanted', () => {
        const fakeProject = '/proj';
        const configPath = path.join(fakeProject, '.vscode', 'extensions.json');
        sandbox.replace(fs, 'existsSync', (p: fs.PathLike) => p === configPath);

        // Return string if encoding is specified, Buffer otherwise
        sandbox.replace(fs, 'readFileSync', (_path: fs.PathLike | number, options?: any): any => {
            const json = JSON.stringify({
                recommendations: ['ext1'],
                unwantedRecommendations: ['ext2']
            });
            if (
                options === 'utf-8' ||
                options === 'utf8' ||
                (options && typeof options.encoding === 'string')
            ) {
                return json;
            }
            return Buffer.from(json, 'utf-8');
        });

        // @ts-ignore
        const result = extension.getExtensionsJson(fakeProject);
        assert.deepStrictEqual(result, { recommendations: ['ext1'], unwantedRecommendations: ['ext2'] });
    });

    test('analyzeExtensions splits enable/disable correctly', () => {
        function fakeExt(id: string): vscode.Extension<any> {
            return {
                id,
                extensionUri: {} as any,
                extensionPath: '',
                isActive: false,
                packageJSON: {},
                exports: {},
                activate: async () => ({}),
                extensionKind: 1
            };
        }
        sinon.replaceGetter(vscode.extensions, 'all', () => [fakeExt('a'), fakeExt('b'), fakeExt('c')]);
        // @ts-ignore
        const result = extension.analyzeExtensions(['a', 'c']);
        assert.deepStrictEqual(result, { toEnable: ['a', 'c'], toDisable: ['b'] });
    });

    test('showExtensionRecommendations opens panel on selection', async () => {
        const infoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves('Open Extensions Panel' as any);
        const cmdStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();

        // @ts-ignore
        await extension.showExtensionRecommendations(['a'], ['b']);
        assert.ok(infoStub.calledOnce);
        assert.ok(cmdStub.calledWith('workbench.view.extensions'));
    });
});
