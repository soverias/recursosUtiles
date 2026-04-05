using FluentAssertions;
using RecursosUtiles.SharedKernel;

namespace RecursosUtiles.SharedKernel.Tests;

// ValueObject concreto de prueba: Money con Amount y Currency
file sealed class Money : ValueObject
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
    {
        Amount = amount;
        Currency = currency;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }
}

public class ValueObjectTests
{
    [Fact]
    public void ValueObjects_ConMismosComponentes_SonIguales()
    {
        var a = new Money(100m, "EUR");
        var b = new Money(100m, "EUR");

        a.Should().Be(b);
        (a == b).Should().BeTrue();
    }

    [Fact]
    public void ValueObjects_ConDistintosComponentes_SonDiferentes()
    {
        var a = new Money(100m, "EUR");
        var b = new Money(200m, "EUR");

        a.Should().NotBe(b);
        (a != b).Should().BeTrue();
    }

    // Triangulación: diferencia en segundo componente
    [Fact]
    public void ValueObjects_ConDistintaMoneda_SonDiferentes()
    {
        var a = new Money(100m, "EUR");
        var b = new Money(100m, "USD");

        a.Should().NotBe(b);
    }

    // Triangulación: GetHashCode consistente con igualdad
    [Fact]
    public void ValueObjects_Iguales_TienenMismoHashCode()
    {
        var a = new Money(50m, "GBP");
        var b = new Money(50m, "GBP");

        a.GetHashCode().Should().Be(b.GetHashCode());
    }

    [Fact]
    public void ValueObject_VsNull_NoSonIguales()
    {
        var money = new Money(10m, "EUR");
        Money? nullMoney = null;

        (money == nullMoney).Should().BeFalse();
        money.Equals((ValueObject?)null).Should().BeFalse();
    }

    [Fact]
    public void ValueObject_EqualsObject_FuncionaCorrectamente()
    {
        var a = new Money(10m, "EUR");
        var b = new Money(10m, "EUR");

        a.Equals((object)b).Should().BeTrue();
    }
}
