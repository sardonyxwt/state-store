import { setStoreDevTool } from '@source';

describe('Scope', () => {
    it('setStoreDevTool', () => {
        setStoreDevTool({
            onAction() {
                return;
            },
            onActionError() {
                return;
            },
            onChangeScope() {
                return;
            },
            onCreateScope() {
                return;
            },
            onCreateStore() {
                return;
            },
            onChangeStore() {
                return;
            },
        });
    });
});
