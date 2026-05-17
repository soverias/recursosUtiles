namespace Reminders.Domain.ValueObjects;

/// <summary>
/// Wall-clock time of day in "HH:mm" format. Independent of any date or timezone.
/// </summary>
public readonly record struct LocalTime
{
    public int Hour { get; }
    public int Minute { get; }

    public LocalTime(int hour, int minute)
    {
        if (hour is < 0 or > 23) throw new ArgumentOutOfRangeException(nameof(hour));
        if (minute is < 0 or > 59) throw new ArgumentOutOfRangeException(nameof(minute));
        Hour = hour;
        Minute = minute;
    }

    public static LocalTime Parse(string value)
    {
        if (!TryParse(value, out var result))
            throw new FormatException($"LocalTime must be 'HH:mm' (got '{value}')");
        return result;
    }

    public static bool TryParse(string? value, out LocalTime result)
    {
        result = default;
        if (string.IsNullOrEmpty(value) || value.Length != 5 || value[2] != ':')
            return false;
        if (!int.TryParse(value.AsSpan(0, 2), out var h)) return false;
        if (!int.TryParse(value.AsSpan(3, 2), out var m)) return false;
        if (h is < 0 or > 23 || m is < 0 or > 59) return false;
        result = new LocalTime(h, m);
        return true;
    }

    public override string ToString() => $"{Hour:D2}:{Minute:D2}";
}
