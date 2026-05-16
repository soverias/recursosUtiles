using FluentAssertions;
using RecursosUtiles.SharedKernel;

namespace RecursosUtiles.SharedKernel.Tests;

public class ErrorTests
{
    [Fact]
    public void None_TieneCodigoYDescripcionVacios()
    {
        Error.None.Code.Should().BeEmpty();
        Error.None.Description.Should().BeEmpty();
    }

    [Fact]
    public void NullValue_TieneCodigoEsperado()
    {
        Error.NullValue.Code.Should().Be("Error.NullValue");
        Error.NullValue.Description.Should().NotBeEmpty();
    }

    [Fact]
    public void Validation_CreaErrorConCodigoYDescripcion()
    {
        var error = Error.Validation("User.InvalidEmail", "El email no es válido.");

        error.Code.Should().Be("User.InvalidEmail");
        error.Description.Should().Be("El email no es válido.");
    }

    [Fact]
    public void NotFound_CreaErrorConCodigoYDescripcion()
    {
        var error = Error.NotFound("User.NotFound", "El usuario no existe.");

        error.Code.Should().Be("User.NotFound");
        error.Description.Should().Be("El usuario no existe.");
    }

    [Fact]
    public void Conflict_CreaErrorConCodigoYDescripcion()
    {
        var error = Error.Conflict("User.DuplicateEmail", "El email ya está registrado.");

        error.Code.Should().Be("User.DuplicateEmail");
        error.Description.Should().Be("El email ya está registrado.");
    }

    // Triangulación: dos errores con el mismo código deben ser iguales (record)
    [Fact]
    public void Errors_ConMismoCodigo_SonIguales()
    {
        var a = Error.Validation("X.Code", "desc");
        var b = Error.Validation("X.Code", "desc");

        a.Should().Be(b);
    }

    [Fact]
    public void Errors_ConDistintoCodigo_SonDiferentes()
    {
        var a = Error.Validation("X.Code1", "desc");
        var b = Error.Validation("X.Code2", "desc");

        a.Should().NotBe(b);
    }
}
