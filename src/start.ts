import { isBrowser } from "./tools/isBrowser";
import { assert } from "tsafe/assert";
import type { ColorScheme } from "./useIsDark";
import { startClientSideIsDarkLogic } from "./useIsDark/client";
import { Deferred } from "./tools/Deferred";
import { DEFAULT_TRUSTED_TYPES_POLICY_NAME } from "./tools/trustedTypesPolicy/config";

type Params = {
    defaultColorScheme: ColorScheme | "system";
    verbose: boolean;
    nextParams:
        | {
              doPersistDarkModePreferenceWithCookie: boolean;
              registerEffectAction: (effect: () => void) => void;
          }
        | undefined;
    doCheckNonce?: boolean;
    trustedTypesPolicyName?: string;
};

let isStarted = false;

export async function start(params: Params) {
    const {
        defaultColorScheme,
        verbose,
        nextParams,
        doCheckNonce = false,
        trustedTypesPolicyName = DEFAULT_TRUSTED_TYPES_POLICY_NAME
    } = params;

    assert(isBrowser);

    if (isStarted) {
        return;
    }

    isStarted = true;

    const registerEffectAction: (action: () => void) => void =
        nextParams === undefined ? action => action() : nextParams.registerEffectAction;

    startClientSideIsDarkLogic({
        "colorSchemeExplicitlyProvidedAsParameter": defaultColorScheme,
        "doPersistDarkModePreferenceWithCookie":
            nextParams === undefined ? false : nextParams.doPersistDarkModePreferenceWithCookie,
        registerEffectAction,
        doCheckNonce,
        trustedTypesPolicyName
    });

    // @ts-expect-error
    window.dsfr = {
        verbose,
        "mode": "react"
    };

    // @ts-expect-error
    await import("./dsfr/dsfr.module.min");

    dDsfrLoaded.resolve();

    registerEffectAction(() => {
        // @ts-expect-error
        window.dsfr.start();
    });
}

const dDsfrLoaded = new Deferred<void>();

export const prDsfrLoaded = dDsfrLoaded.pr;
