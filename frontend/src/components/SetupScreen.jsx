import CooldownLabel from './CooldownLabel';
import Mark from './Mark';
import StatusNote from './StatusNote';
import { useCooldown } from '../lib/useCooldown';

// Named by the backend's own check; shown when the server sent no list of its own
const REQUIRED_KEYS = ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_REDIRECT_URI'];

const DEFAULT_ENV_FILE = 'backend/.env';

function keysOf(setup) {
    const list = Array.isArray(setup?.missing)
        ? setup.missing.filter((key) => typeof key === 'string' && key.trim() !== '')
        : [];
    return list.length > 0 ? list : REQUIRED_KEYS;
}

/**
 * Shown while Discord sign-in is unconfigured: every route but /auth/me answers 503
 * No sign-in button: it would lead nowhere until the keys are set
 */
export default function SetupScreen({ setup = null, onRetry }) {
    const keys = keysOf(setup);
    const envFile = typeof setup?.envFile === 'string' && setup.envFile.trim()
        ? setup.envFile.trim()
        : DEFAULT_ENV_FILE;

    const noSessionSecret = setup?.sessionSecret === false;

    // Same key as the gate's retry: both ask the one session route
    const retryCooldown = useCooldown('session-recheck');
    const retry = () => {
        retryCooldown.start();
        onRetry();
    };

    return (
        <main className="gate">
            <span className="gate__grain" aria-hidden="true" />

            <section className="gate__card">
                <div className="gate__brand">
                    <Mark size={30} />
                    <span className="gate__word">Veritas</span>
                </div>

                <div className="gate__block">
                    <h1 className="gate__title u-display">This panel is not set up yet</h1>
                    <p className="gate__text">
                        Nobody can use it until the server owner configures Discord sign-in.
                    </p>

                    <p className="gate__text">Whoever runs this server:</p>
                    <ol className="gate__steps">
                        <li>Create a Discord application and add an OAuth2 redirect for this panel.</li>
                        <li>
                            Set {keys.map((key, index) => (
                                <span key={key}>
                                    {index > 0 && ', '}
                                    <code className="gate__key u-mono">{key}</code>
                                </span>
                            ))} in <code className="gate__key u-mono">{envFile}</code>.
                        </li>
                        <li>
                            Map an owner with <code className="gate__key u-mono">DISCORD_OWNER_IDS</code>
                            {' '}or <code className="gate__key u-mono">DISCORD_ROLE_OWNER</code>.
                        </li>
                        <li>Restart the backend, then check again.</li>
                    </ol>
                    <p className="gate__text">README.md walks through all of it.</p>

                    {noSessionSecret && (
                        <StatusNote
                            tone="warn"
                            title="SESSION_SECRET is missing"
                            detail="Set it too, or every backend restart signs everyone out."
                        />
                    )}

                    <button
                        type="button"
                        className="btn gate__action"
                        onClick={retry}
                        disabled={!retryCooldown.ready}
                    >
                        <CooldownLabel text="Check again" remaining={retryCooldown.remaining} />
                    </button>
                </div>
            </section>
        </main>
    );
}
