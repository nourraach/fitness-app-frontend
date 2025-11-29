import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifivationComponent } from './verifivation.component';

describe('VerifivationComponent', () => {
  let component: VerifivationComponent;
  let fixture: ComponentFixture<VerifivationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifivationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifivationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
