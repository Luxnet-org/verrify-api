export default class AppConstants {
  public static readonly PAGE_MAX_LIMIT = 100;
  public static readonly PAGE_LIMIT = 50;
  public static readonly PAGE = 1;
  public static readonly PAGE_SORT = 'createdAt';
  public static readonly PAGE_ORDER = 'ASC';
  public static readonly PAGE_SEARCH = '';

  public static readonly APP_GLOBAL_PREFIX = 'api/v1';

  public static readonly PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!.%?&])[A-Za-z\d@$!.%?&]{8,20}$/;
}
