import * as I18nString from '../I18nString/I18nString.ts'
import * as UiStrings from '../UiStrings/UiStrings.ts'

export const workers = (): string => I18nString.i18nString(UiStrings.Workers)
export const refresh = (): string => I18nString.i18nString(UiStrings.Refresh)
export const name = (): string => I18nString.i18nString(UiStrings.Name)
export const javaScriptHeapUsed = (): string => I18nString.i18nString(UiStrings.JavaScriptHeapUsed)
export const unavailable = (): string => I18nString.i18nString(UiStrings.Unavailable)
export const noWorkersAreRunning = (): string => I18nString.i18nString(UiStrings.NoWorkersAreRunning)
