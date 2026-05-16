using FluentAssertions;
using RecursosUtiles.SharedKernel;

namespace RecursosUtiles.SharedKernel.Tests;

public class ResultTests
{
    // --- Result (no genérico) ---

    [Fact]
    public void Success_IsSuccessTrue_IsFailureFalse()
    {
        var result = Result.Success();

        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.Error.Should().Be(Error.None);
    }

    [Fact]
    public void Failure_IsSuccessFalse_IsFailureTrue()
    {
        var error = Error.Validation("Test.Error", "Error de prueba.");
        var result = Result.Failure(error);

        result.IsSuccess.Should().BeFalse();
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Be(error);
    }

    // Triangulación: no se puede crear Success con error distinto de None
    [Fact]
    public void Success_ConError_LanzaInvalidOperationException()
    {
        var act = () => Result.Failure(Error.None);

        act.Should().Throw<InvalidOperationException>();
    }

    // Triangulación: no se puede crear Failure sin error
    [Fact]
    public void Failure_SinError_LanzaInvalidOperationException()
    {
        // Result.Failure(Error.None) debe lanzar
        var act = () => Result.Failure(Error.None);

        act.Should().Throw<InvalidOperationException>();
    }

    // Implicit conversion de Error → Result
    [Fact]
    public void ImplicitConversion_DeError_CreasResultFailure()
    {
        var error = Error.NotFound("User.NotFound", "No existe.");
        Result result = error;

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Be(error);
    }

    // --- Result<T> (genérico) ---

    [Fact]
    public void Success_T_ValueAccesible()
    {
        var result = Result.Success<int>(42);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(42);
    }

    [Fact]
    public void Failure_T_ValueLanzaExcepcion()
    {
        var error = Error.Validation("Test.Error", "desc");
        var result = Result.Failure<int>(error);

        result.IsFailure.Should().BeTrue();
        var act = () => result.Value;
        act.Should().Throw<InvalidOperationException>();
    }

    // Triangulación: tipo referencia
    [Fact]
    public void Success_T_ConTipoReferencia_ValueAccesible()
    {
        var result = Result.Success<string>("hola");

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be("hola");
    }
}
