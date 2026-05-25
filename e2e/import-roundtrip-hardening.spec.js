const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

function normalizeNewlines(text) {
    return String(text || '').replace(/\r\n/g, '\n');
}

async function importProject(page, payload) {
    return page.evaluate((value) => {
        const storage = window.ZenWriterStorage;
        const jsonString = typeof value === 'string' ? value : JSON.stringify(value);
        const before = storage.loadDocuments() || [];
        const beforeJson = JSON.stringify(before);
        const importedId = storage.importProjectJSON(jsonString);
        const docs = storage.loadDocuments() || [];
        const doc = docs.find(d => d && d.id === importedId) || null;
        const chapters = docs
            .filter(d => d && d.type === 'chapter' && d.parentId === importedId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        return {
            importedId,
            doc,
            chapters,
            docs,
            beforeJson,
            afterJson: JSON.stringify(docs)
        };
    }, payload);
}

test.describe('Import Roundtrip Hardening', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/index.html?reset=1');
        await page.waitForLoadState('networkidle');
        await ensureNormalMode(page);
    });

    test('imports without overwriting existing docs and normalizes page records', async ({ page }) => {
        await page.evaluate(() => {
            const storage = window.ZenWriterStorage;
            const now = Date.now();
            storage.saveDocuments([
                {
                    id: 'doc_existing_base',
                    type: 'document',
                    name: 'Collision Story',
                    content: 'existing base body',
                    chapterMode: true,
                    parentId: null,
                    createdAt: now,
                    updatedAt: now
                },
                {
                    id: 'doc_existing_suffix',
                    type: 'document',
                    name: 'Collision Story (読み込み 2)',
                    content: 'existing suffix body',
                    chapterMode: true,
                    parentId: null,
                    createdAt: now,
                    updatedAt: now
                }
            ]);
            storage.setCurrentDocId('doc_existing_base');
        });

        const result = await importProject(page, {
            format: 'zenwriter-v1',
            document: {
                id: 'doc_original',
                name: 'Collision Story',
                content: '',
                chapterMode: true,
                createdAt: 12345
            },
            pages: [
                { title: '遅い章', content: 'late body', order: 2, level: 9, visibility: 'visible' },
                { title: '重複章', content: 'first body', order: 0, level: 0, visibility: 'archived' },
                { title: '', content: 'blank title body', order: 0, level: 3, visibility: 'hidden' },
                { title: '重複章', content: 77, metadata: { keep: true } }
            ]
        });

        expect(result.importedId).toMatch(/^doc_/);
        expect(result.doc.name).toBe('Collision Story (読み込み 3)');
        expect(result.doc.id).not.toBe('doc_original');
        expect(normalizeNewlines(result.doc.content)).toContain('# 重複章\n\nfirst body');
        expect(normalizeNewlines(result.doc.content)).toContain('### ページ 2\n\nblank title body');
        expect(normalizeNewlines(result.doc.content)).toContain('###### 遅い章\n\nlate body');

        const existing = result.docs.filter(d => d && d.type === 'document' && d.id.indexOf('doc_existing_') === 0);
        expect(existing).toHaveLength(2);
        expect(existing.map(d => d.content).sort()).toEqual(['existing base body', 'existing suffix body']);

        expect(result.chapters).toHaveLength(4);
        expect(result.chapters.map(ch => ch.name)).toEqual(['重複章', 'ページ 2', '遅い章', '重複章']);
        expect(result.chapters.map(ch => ch.order)).toEqual([0, 1, 2, 3]);
        expect(result.chapters[0]).toMatchObject({ content: 'first body', level: 1, visibility: 'visible' });
        expect(result.chapters[1]).toMatchObject({ content: 'blank title body', level: 3, visibility: 'hidden' });
        expect(result.chapters[2]).toMatchObject({ content: 'late body', level: 6, visibility: 'visible' });
        expect(result.chapters[3]).toMatchObject({ content: '', level: 2, visibility: 'visible', metadata: { keep: true } });
        expect(new Set(result.chapters.map(ch => ch.id)).size).toBe(4);
    });

    test('imports legacy pages-only JSON without a format field', async ({ page }) => {
        const result = await importProject(page, {
            pages: [
                { title: 'Legacy Later', content: 'later body', order: 3 },
                { title: 'Legacy First', content: 'first body', order: 0, visibility: 'draft' }
            ]
        });

        expect(result.doc.name).toBe('読み込みドキュメント');
        expect(result.chapters.map(ch => ch.name)).toEqual(['Legacy First', 'Legacy Later']);
        expect(result.chapters[0]).toMatchObject({ content: 'first body', order: 0, visibility: 'draft' });
        expect(result.chapters[1]).toMatchObject({ content: 'later body', order: 1, visibility: 'visible' });
        expect(normalizeNewlines(result.doc.content)).toContain('## Legacy First\n\nfirst body');
        expect(normalizeNewlines(result.doc.content)).toContain('## Legacy Later\n\nlater body');
    });

    test('rejects invalid projects without mutating documents', async ({ page }) => {
        await page.evaluate(() => {
            const storage = window.ZenWriterStorage;
            const now = Date.now();
            storage.saveDocuments([
                {
                    id: 'doc_keep',
                    type: 'document',
                    name: 'Keep Me',
                    content: 'safe content',
                    chapterMode: true,
                    parentId: null,
                    createdAt: now,
                    updatedAt: now
                }
            ]);
        });

        const payloads = [
            '{',
            JSON.stringify({ format: 'other-v1', document: { name: 'Bad', content: 'bad' } }),
            JSON.stringify({}),
            JSON.stringify({ pages: [{ metadata: { only: true } }] })
        ];

        for (const payload of payloads) {
            const result = await importProject(page, payload);
            expect(result.importedId).toBeNull();
            expect(result.afterJson).toBe(result.beforeJson);
        }

        const docs = await page.evaluate(() => window.ZenWriterStorage.loadDocuments());
        expect(docs).toHaveLength(1);
        expect(docs[0]).toMatchObject({ id: 'doc_keep', name: 'Keep Me', content: 'safe content' });
    });
});
