import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvolutionPoidsComponent } from './evolution-poids.component';

describe('EvolutionPoidsComponent', () => {
  let component: EvolutionPoidsComponent;
  let fixture: ComponentFixture<EvolutionPoidsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvolutionPoidsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvolutionPoidsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
