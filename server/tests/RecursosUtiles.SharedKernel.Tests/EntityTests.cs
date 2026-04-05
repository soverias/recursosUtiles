using FluentAssertions;
using RecursosUtiles.SharedKernel;

namespace RecursosUtiles.SharedKernel.Tests;

// Clase concreta de prueba
file sealed class TestEntity : Entity<Guid>
{
    public TestEntity(Guid id) : base(id) { }
}

public class EntityTests
{
    [Fact]
    public void Entity_ExponePropiedadId()
    {
        var id = Guid.NewGuid();
        var entity = new TestEntity(id);

        entity.Id.Should().Be(id);
    }

    [Fact]
    public void Entities_ConMismoId_SonIguales()
    {
        var id = Guid.NewGuid();
        var a = new TestEntity(id);
        var b = new TestEntity(id);

        a.Should().Be(b);
        (a == b).Should().BeTrue();
    }

    [Fact]
    public void Entities_ConDistintoId_SonDiferentes()
    {
        var a = new TestEntity(Guid.NewGuid());
        var b = new TestEntity(Guid.NewGuid());

        a.Should().NotBe(b);
        (a != b).Should().BeTrue();
    }

    // Triangulación: IEquatable<Entity<TId>>
    [Fact]
    public void Entity_EqualsObject_FuncionaCorrectamente()
    {
        var id = Guid.NewGuid();
        var a = new TestEntity(id);
        var b = new TestEntity(id);

        a.Equals((object)b).Should().BeTrue();
    }

    // Triangulación: GetHashCode es consistente con igualdad
    [Fact]
    public void Entities_ConMismoId_TienenMismoHashCode()
    {
        var id = Guid.NewGuid();
        var a = new TestEntity(id);
        var b = new TestEntity(id);

        a.GetHashCode().Should().Be(b.GetHashCode());
    }

    [Fact]
    public void Entity_VsNull_NoSonIguales()
    {
        var entity = new TestEntity(Guid.NewGuid());

        (entity == null).Should().BeFalse();
        (null == entity).Should().BeFalse();
    }
}
