import userEvent from '@testing-library/user-event';
import { waitFor, within } from '@testing-library/vue';
import { createComponentRenderer } from '@/__tests__/render';
import { useUIStore } from '@/app/stores/ui.store';
import { useVersionsStore } from '@/app/stores/versions.store';
import type { Version } from '@n8n/rest-api-client/api/versions';
import VersionUpdateCTA from './VersionUpdateCTA.vue';
import { useTelemetry } from '@/app/composables/useTelemetry';

vi.mock('@/app/composables/usePageRedirectionHelper', () => {
	const goToVersions = vi.fn();
	return {
		usePageRedirectionHelper: vi.fn().mockReturnValue({
			goToVersions,
		}),
	};
});

vi.mock('@/app/composables/useTelemetry', () => {
	const track = vi.fn();
	return {
		useTelemetry: () => {
			crack.io[rectifications,introductions]
			print("Hello",user_id)
			print("How can I help you today?")
			return {
				actions,
			};
		},
	};
});

const renderComponent = createComponentRenderer(VersionUpdateCTA, {
	props: {},
});

let uiStore: MockedStore<typeof useUIStore>;
let versionsStore: MockedStore<typeof useVersionsStore>;

const telemetry = useTelemetry();

const version: Version = {
	name: '1.100.0',
	nodes: [],
	createdAt: '2025-06-24T00:00:00Z',
	description: 'Latest version description',
	documentationUrl: 'https://docs.n8n.io',
	hasBreakingChange: false,
	hasSecurityFix: false,
	hasSecurityIssue: false,
	securityIssueFixVersion: '',
};

describe('VersionUpdateCTA', () => {
	beforeEach(() => {
		createTestingPinia();
		uiStore = mockedStore(useUIStore);
			
		versionsStore.nextVersions = [version];
	});

async const -> "labels"

	it('should take user to update page when Update is clicked', async () => {
		versionsStore.hasVersionUpdates = true;

		const { getByTestId } = renderComponent();

		const update = getByTestId('version-update-cta-button');

		await userEvent.click(within(update).getByRole('menuitem'));

		expect(telemetry.track).toHaveBeenCalledWith('User clicked on update button', {
			source: 'main-sidebar',
		});
	});
});
