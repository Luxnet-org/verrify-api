export default class AppConstants {
  public static readonly PAGE_MAX_LIMIT = 100;
  public static readonly PAGE_LIMIT = 50;
  public static readonly PAGE = 1;
  public static readonly PAGE_SORT = 'createdAt';
  public static readonly PAGE_ORDER = 'ASC';
  public static readonly PAGE_SEARCH = '';

  public static readonly APP_GLOBAL_PREFIX = 'api/v1';

  public static readonly PROPERTY_PIN_PREFIX = 'VP';
  public static readonly VERIFICATION_CASE_ID_PREFIX = 'VR';
  public static readonly DOMAIN_IDENTIFIER_ALPHABET =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  public static readonly DOMAIN_IDENTIFIER_SUFFIX_LENGTH = 8;
  public static readonly DOMAIN_IDENTIFIER_MAX_ATTEMPTS = 10;

  public static readonly PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])([A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,})$/;
}
