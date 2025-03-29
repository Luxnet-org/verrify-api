export class DateUtility {
  static get currentDate() {
    return new Date(Date.now());
  }

  static date(date: Date) {
    return new Date(date);
  }

  static addMinutes(value: number): Date {
    const currentDate = this.currentDate;
    currentDate.setUTCMinutes(currentDate.getUTCMinutes() + value);

    return currentDate;
  }

  static addDay(value: number): Date {
    const currentDate = this.currentDate;
    currentDate.setUTCDate(currentDate.getUTCDate() + value);

    return currentDate;
  }

  static get validDob(): Date {
    const currentDate: Date = this.currentDate;
    currentDate.setUTCFullYear(currentDate.getUTCFullYear() - 10);
    return currentDate;
  }
}
